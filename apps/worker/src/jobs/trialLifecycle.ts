import { prisma } from '../lib/db.js';
import { resend, FROM_EMAIL } from '../lib/resend.js';
import { withResendRateLimit } from '../lib/resendRateLimit.js';
import { montarTrialEmail, type TrialEmailKind } from '../lib/trialEmails.js';

const APP_URL = process.env.APP_URL || 'https://www.rankea.ai';
const REMETENTE = `Rankea <${FROM_EMAIL}>`;

const DIA = 24 * 60 * 60 * 1000;

/** Só envia em horário comercial de Brasília. Lembrete às 3h da manhã é desrespeito. */
const HORA_INICIO = 9;
const HORA_FIM = 18;

/**
 * Piso do lembrete de vencido: só alcança quem venceu nos últimos 7 dias.
 * Sem isso, a primeira execução em produção manda "seu teste terminou" para toda conta
 * antiga de uma vez, incluindo cadastro de meses atrás. Isso não é reativação, é mala
 * direta, e queima o domínio junto.
 */
const JANELA_VENCIDO_DIAS = 7;

function horaEmSaoPaulo(agora = new Date()): number {
  const h = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false,
  }).format(agora);
  return parseInt(h, 10);
}

function primeiroNome(nome: string | null, email: string): string {
  const base = (nome || '').trim();
  if (base) return base.split(/\s+/)[0];
  return email.split('@')[0];
}

interface Alvo {
  recruiterId: string;
  email: string;
  nome: string | null;
  trialEndsAt: Date;
}

/**
 * Quem deve receber cada lembrete. As janelas são abertas de propósito (tudo que já
 * passou do marco), e não faixas estreitas de um dia: se o worker ficar fora do ar por
 * algumas horas, ninguém deixa de receber. Mandar duas vezes é impedido pela UNIQUE
 * em lifecycle_emails, não pela janela.
 */
async function buscarAlvos(kind: TrialEmailKind, agora: Date): Promise<Alvo[]> {
  const base = {
    status: 'trialing',
    trial_ends_at: { not: null },
  };

  const filtroData =
    kind === 'trial_d7'
      ? { gt: agora, lte: new Date(agora.getTime() + 7 * DIA) }
      : kind === 'trial_d1'
        ? { gt: agora, lte: new Date(agora.getTime() + 1 * DIA) }
        // Espera 12h depois do vencimento: o e-mail chega quando a pessoa já sentiu
        // o bloqueio, não no mesmo segundo em que ele acontece. E não alcança quem
        // venceu há mais de JANELA_VENCIDO_DIAS.
        : {
            lte: new Date(agora.getTime() - 12 * 60 * 60 * 1000),
            gte: new Date(agora.getTime() - JANELA_VENCIDO_DIAS * DIA),
          };

  const subs = await prisma.subscription.findMany({
    where: { ...base, trial_ends_at: filtroData },
    select: {
      recruiter_id: true,
      trial_ends_at: true,
      recruiter: { select: { email: true, name: true } },
    },
    take: 500,
  });

  return subs
    .filter((s) => s.recruiter?.email && s.trial_ends_at)
    .map((s) => ({
      recruiterId: s.recruiter_id,
      email: s.recruiter!.email,
      nome: s.recruiter!.name,
      trialEndsAt: s.trial_ends_at!,
    }));
}

async function jaEnviado(recruiterId: string, kind: TrialEmailKind): Promise<boolean> {
  const r = await prisma.lifecycleEmail.findUnique({
    where: { recruiter_id_kind: { recruiter_id: recruiterId, kind } },
    select: { id: true },
  });
  return r !== null;
}

async function usoDoRecrutador(recruiterId: string) {
  // Sequencial: o pool do banco tem uma conexão só.
  const vagasCriadas = await prisma.job.count({
    where: { user_id: recruiterId, deleted_at: null },
  });
  const candidatosAvaliados = await prisma.candidate.count({
    where: { deleted_at: null, fit_score: { not: null }, job: { user_id: recruiterId } },
  });
  return { vagasCriadas, candidatosAvaliados };
}

async function enviar(kind: TrialEmailKind, alvo: Alvo, agora: Date): Promise<boolean> {
  if (!resend) {
    console.warn('[trialLifecycle] RESEND_API_KEY ausente, nada enviado');
    return false;
  }

  const uso = await usoDoRecrutador(alvo.recruiterId);
  const diasRestantes = Math.max(
    0,
    Math.ceil((alvo.trialEndsAt.getTime() - agora.getTime()) / DIA)
  );

  const { subject, html } = montarTrialEmail(kind, {
    nome: primeiroNome(alvo.nome, alvo.email),
    diasRestantes,
    candidatosAvaliados: uso.candidatosAvaliados,
    vagasCriadas: uso.vagasCriadas,
    appUrl: APP_URL,
  });

  // Grava ANTES de enviar. Se o envio falhar, a pessoa perde um lembrete; se gravasse
  // depois e o processo caísse no meio, ela receberia o mesmo e-mail em toda varredura.
  try {
    await prisma.lifecycleEmail.create({
      data: { recruiter_id: alvo.recruiterId, kind },
    });
  } catch {
    // Violação da UNIQUE: outra execução já pegou este alvo.
    return false;
  }

  await withResendRateLimit(() =>
    resend!.emails.send({ from: REMETENTE, to: alvo.email, subject, html })
  );

  console.log(`[trialLifecycle] ${kind} enviado para ${alvo.email}`);
  return true;
}

export interface ResultadoVarredura {
  executou: boolean;
  motivo?: string;
  enviados: Record<TrialEmailKind, number>;
  /** Preenchido só em simulação: quem receberia, sem nada ter sido enviado. */
  simulacao?: Array<{ kind: TrialEmailKind; email: string; venceEm: string }>;
}

export async function varrerTrials(
  opts: { ignorarHorario?: boolean; simular?: boolean } = {}
): Promise<ResultadoVarredura> {
  const agora = new Date();
  const enviados: Record<TrialEmailKind, number> = { trial_d7: 0, trial_d1: 0, trial_expired: 0 };

  const simulacao: NonNullable<ResultadoVarredura['simulacao']> = [];

  if (!opts.ignorarHorario && !opts.simular) {
    const hora = horaEmSaoPaulo(agora);
    if (hora < HORA_INICIO || hora >= HORA_FIM) {
      return { executou: false, motivo: `fora do horário de envio (${hora}h em São Paulo)`, enviados };
    }
  }

  // Ordem importa: o mais urgente primeiro. Quem está a 1 dia do fim também cai na
  // janela de 7 dias, e sem esta ordem receberia o lembrete errado.
  const ordem: TrialEmailKind[] = ['trial_expired', 'trial_d1', 'trial_d7'];

  for (const kind of ordem) {
    const alvos = await buscarAlvos(kind, agora);
    for (const alvo of alvos) {
      try {
        if (await jaEnviado(alvo.recruiterId, kind)) continue;
        // Quem já recebeu um lembrete mais urgente não recebe o menos urgente depois.
        if (kind === 'trial_d7' && (await jaEnviado(alvo.recruiterId, 'trial_d1'))) continue;
        if (opts.simular) {
          simulacao.push({ kind, email: alvo.email, venceEm: alvo.trialEndsAt.toISOString() });
          enviados[kind] += 1;
          continue;
        }
        if (await enviar(kind, alvo, agora)) enviados[kind] += 1;
      } catch (err) {
        console.error(`[trialLifecycle] falha em ${kind} para ${alvo.email}:`, err);
      }
    }
  }

  return opts.simular ? { executou: true, enviados, simulacao } : { executou: true, enviados };
}

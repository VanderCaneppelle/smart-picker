import { prisma } from '../lib/db.js';
import { scoreCandidate, type ExtractedCandidateData } from './scoreCandidate.js';
import { sendEmails } from './sendEmails.js';
import type { ResumeIntegrityResult } from '../lib/resumeIntegrity.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);

/** Identificador do flag de integridade, para não duplicar ao recalcular a nota. */
const INTEGRITY_FLAG_ID = 'resume_integrity';

interface ExistingFlag {
  question_id?: string;
  [key: string]: unknown;
}

/**
 * Monta os campos de alerta a partir da checagem de integridade do currículo,
 * preservando os flags já gravados pelas perguntas eliminatórias e substituindo
 * apenas o flag de integridade anterior (caso a nota esteja sendo recalculada).
 */
function buildIntegrityUpdate(
  candidate: { disqualification_flags: unknown; flagged_reason: string | null },
  integrity: ResumeIntegrityResult
) {
  const previous = Array.isArray(candidate.disqualification_flags)
    ? (candidate.disqualification_flags as ExistingFlag[])
    : [];
  const withoutIntegrity = previous.filter((f) => f?.question_id !== INTEGRITY_FLAG_ID);

  // Remove o texto de integridade anterior para não acumular a cada recálculo.
  const previousReason = (candidate.flagged_reason ?? '')
    .split(' | ')
    .filter((part) => part && !part.startsWith('Possível manipulação da triagem:'))
    .join(' | ');

  if (!integrity.manipulated) {
    return {
      disqualification_flags: withoutIntegrity as never,
      flagged_reason: previousReason || null,
    };
  }

  const integrityFlags = integrity.signals.map((signal) => ({
    question_id: INTEGRITY_FLAG_ID,
    question_text: 'Integridade do currículo',
    candidate_answer: signal.excerpt,
    severity: integrity.severity,
    reason: signal.label,
  }));

  return {
    disqualification_flags: [...withoutIntegrity, ...integrityFlags] as never,
    flagged_reason: [previousReason, integrity.summary].filter(Boolean).join(' | '),
  };
}

/** Domínio dos e-mails provisórios criados pela importação. */
const PLACEHOLDER_EMAIL_DOMAIN = '@import.rankea.ai';

interface CandidateParaExtracao {
  name: string;
  email: string;
  phone_number: string | null;
  linkedin_url: string | null;
  source: string;
  /** Null significa que este candidato nunca foi pontuado, ou seja, é a primeira vez. */
  resume_summary: string | null;
}

/**
 * Grava no candidato o que a IA leu do currículo, e só por cima do que ainda é
 * provisório. Dado que o recrutador corrigiu à mão nunca é sobrescrito.
 *
 * Nome e contato só entram na PRIMEIRA pontuação (resume_summary ainda null), porque é a
 * única janela em que o valor com certeza ainda é o provisório: depois dela, qualquer
 * diferença pode ser edição do recrutador, e recalcular a nota não pode desfazer o
 * trabalho dele. O e-mail tem uma trava a mais, o domínio provisório.
 */
function aplicarExtraidos(
  candidate: CandidateParaExtracao,
  extracted: ExtractedCandidateData
): Record<string, string> {
  if (candidate.source === 'form') return {};

  const primeiraPontuacao = candidate.resume_summary === null;
  const update: Record<string, string> = {};

  if (primeiraPontuacao && extracted.name) {
    update.name = extracted.name;
  }
  if (extracted.email && candidate.email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
    update.email = extracted.email;
  }
  if (extracted.phone && !candidate.phone_number) {
    update.phone_number = extracted.phone;
  }
  if (extracted.linkedin && !candidate.linkedin_url) {
    update.linkedin_url = extracted.linkedin;
  }

  return update;
}

export interface ProcessCandidateOptions {
  /** When true, only recalculate score; do not send "candidatura recebida" or recruiter notification. Used for "recalcular nota". */
  skipEmails?: boolean;
}

/** Process a single candidate by ID (event-driven). */
export async function processCandidate(
  candidateId: string,
  options?: ProcessCandidateOptions
): Promise<{ ok: boolean; error?: string }> {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, deleted_at: null, needs_scoring: true },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            application_questions: true,
            resume_weight: true,
            answers_weight: true,
            scoring_instructions: true,
            calendly_link: true,
            recruiter: {
              include: { emailPersonalization: true },
            },
          },
        },
      },
    });

    if (!candidate) {
      return { ok: false, error: 'Candidate not found or already processed' };
    }

    console.log(`Processing candidate: ${candidate.name} (${candidate.id})${options?.skipEmails ? ' (score only, no emails)' : ''}`);

    const scores = await scoreCandidate(candidate);

    const extraidos = aplicarExtraidos(candidate, scores.extracted);
    const importado = candidate.source !== 'form';

    // Faltou nome ou e-mail no currículo: mantém o provisório e manda para o balde de
    // atenção, porque candidato sem e-mail de verdade não dá para convidar nem recusar.
    // O nome só conta na primeira pontuação: depois dela o que está no banco pode ser
    // correção do recrutador, e recalcular a nota não pode acusar de incompleto o que
    // ele já arrumou.
    const primeiraPontuacao = candidate.resume_summary === null;
    const semNome = primeiraPontuacao && !scores.extracted.name;
    const emailAindaProvisorio =
      !extraidos.email && candidate.email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
    const faltaContato = importado && (semNome || emailAindaProvisorio);

    // Mesma pessoa já na vaga, agora vinda por outro caminho. Nunca funde nem apaga
    // nada: avisa e deixa a decisão com o recrutador, que é quem sabe se são a mesma
    // pessoa ou dois homônimos.
    const emailNovo = extraidos.email;
    let possivelDuplicata = false;
    if (emailNovo) {
      const jaExiste = await prisma.candidate.findFirst({
        where: {
          job_id: candidate.job_id,
          email: emailNovo,
          deleted_at: null,
          id: { not: candidate.id },
        },
        select: { id: true },
      });
      possivelDuplicata = jaExiste !== null;
    }

    const resumoFinal = possivelDuplicata
      ? `⚠️ Já existe outro candidato com este e-mail nesta vaga. ${scores.resume_summary}`.trim()
      : scores.resume_summary;

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        fit_score: scores.fit_score,
        resume_rating: scores.resume_rating,
        answer_quality_rating: scores.answer_quality_rating,
        resume_summary: resumoFinal,
        experience_level: scores.experience_level,
        needs_scoring: false,
        needs_review: scores.needs_review || faltaContato || possivelDuplicata,
        ...extraidos,
        ...buildIntegrityUpdate(candidate, scores.integrity),
      },
    });

    // Candidato importado nunca recebe e-mail automático: ele não se candidatou, não deu
    // consentimento, e a mensagem sairia assinada com o nome do recrutador. Não depende
    // de quem chamou lembrar de passar skipEmails.
    if (!options?.skipEmails && !importado) {
      const personalization = candidate.job.recruiter?.emailPersonalization ?? null;
      await sendEmails(candidate, candidate.job, personalization);
    }

    console.log(`Candidate ${candidate.id} processed successfully.`);
    return { ok: true };
  } catch (error) {
    console.error(`Error processing candidate ${candidateId}:`, error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Varredura genérica da fila, sem vaga definida. Hoje ninguém a chama (o fluxo é por
 * evento), e está aqui como rede de segurança para reprocessar a fila inteira à mão.
 * Mesmo assim respeita a regra de ouro do importado: nada de e-mail automático.
 */
export async function processQueue() {
  // Find candidates that need scoring
  const pendingCandidates = await prisma.candidate.findMany({
    where: {
      needs_scoring: true,
      deleted_at: null,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          description: true,
          application_questions: true,
          resume_weight: true,
          answers_weight: true,
          scoring_instructions: true,
          calendly_link: true,
          recruiter: {
            select: { email: true },
            include: { emailPersonalization: true },
          },
        },
      },
    },
    take: BATCH_SIZE,
    orderBy: {
      created_at: 'asc', // Process oldest first
    },
  });

  if (pendingCandidates.length === 0) {
    console.log('No candidates to process.');
    return;
  }

  console.log(`Found ${pendingCandidates.length} candidates to process.`);

  for (const candidate of pendingCandidates) {
    try {
      console.log(`Processing candidate: ${candidate.name} (${candidate.id})`);

      // Score the candidate
      const scores = await scoreCandidate(candidate);

      // Update candidate with scores
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fit_score: scores.fit_score,
          resume_rating: scores.resume_rating,
          answer_quality_rating: scores.answer_quality_rating,
          resume_summary: scores.resume_summary,
          experience_level: scores.experience_level,
          needs_scoring: false,
          needs_review: scores.needs_review,
          ...aplicarExtraidos(candidate, scores.extracted),
          ...buildIntegrityUpdate(candidate, scores.integrity),
        },
      });

      console.log(`Candidate ${candidate.id} scored successfully.`);

      if (candidate.source === 'form') {
        const personalization = candidate.job.recruiter?.emailPersonalization ?? null;
        await sendEmails(candidate, candidate.job, personalization);

        console.log(`Emails sent for candidate ${candidate.id}.`);
      }
    } catch (error) {
      console.error(`Error processing candidate ${candidate.id}:`, error);

      // Mark as processed to avoid infinite retries
      // In production, you might want a retry counter
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          needs_scoring: false,
        },
      });
    }
  }
}

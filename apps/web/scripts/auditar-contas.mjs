/**
 * Auditoria das contas de produção: separa gente de robô e mostra as assinaturas
 * inconsistentes. Só LÊ. Nada aqui apaga nem altera nada.
 *
 *   cd apps/web && node -r dotenv/config scripts/auditar-contas.mjs
 *
 * Existe porque 275 das 282 contas são de robô, e qualquer métrica de funil lida sem
 * esse filtro é ficção. A exclusão é um passo separado e deliberado: apagar conta é
 * irreversível, e uma heurística errada apagaria um usuário de verdade.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Domínios que só existem para criar conta descartável. */
const DOMINIOS_DESCARTAVEIS = [
  '.ml', '.tk', '.ga', '.cf', '.gq',
  'mailinator', 'guerrillamail', 'tempmail', '10minutemail', 'yopmail',
  'throwaway', 'sharklasers', 'dispostable',
];

/**
 * Nome gerado por robô: sem espaço, comprido e com maiúsculas no meio, como
 * "wPVMkoCaNKptcQiE". Um nome humano tem espaço, ou é curto, ou não alterna caixa.
 * Conservador de propósito: prefere deixar robô passar a marcar gente de verdade.
 */
function pareceGerado(nome) {
  if (!nome) return false;
  const limpo = nome.trim();
  if (limpo.includes(' ')) return false;
  if (limpo.length < 10) return false;
  const temMaiusculaNoMeio = /[a-z][A-Z]/.test(limpo);
  const proporcaoVogais = (limpo.match(/[aeiouAEIOU]/g) || []).length / limpo.length;
  return temMaiusculaNoMeio && proporcaoVogais < 0.32;
}

function dominioDescartavel(email) {
  const e = (email || '').toLowerCase();
  return DOMINIOS_DESCARTAVEIS.some((d) => (d.startsWith('.') ? e.endsWith(d) : e.includes(d)));
}

const recrutadores = await prisma.recruiter.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    company: true,
    created_at: true,
    _count: { select: { jobs: true } },
  },
  orderBy: { created_at: 'asc' },
});

// Em série, nunca Promise.all: pgbouncer com connection_limit=1.
const assinaturas = await prisma.subscription.findMany({
  select: {
    recruiter_id: true,
    status: true,
    plan: true,
    current_period_end: true,
    trial_ends_at: true,
    created_at: true,
  },
});
const porRecrutador = new Map(assinaturas.map((s) => [s.recruiter_id, s]));

const suspeitos = [];
const humanos = [];

for (const r of recrutadores) {
  const assinatura = porRecrutador.get(r.id);
  const pagante = assinatura?.status === 'active' && assinatura.plan && assinatura.plan !== 'test';
  const sinais = [];

  if (pareceGerado(r.name)) sinais.push('nome gerado');
  if (pareceGerado(r.company)) sinais.push('empresa gerada');
  if (dominioDescartavel(r.email)) sinais.push('domínio descartável');

  // Quem publicou vaga ou paga nunca entra na lista, por mais estranho que seja o nome.
  if (sinais.length > 0 && r._count.jobs === 0 && !pagante) suspeitos.push({ ...r, sinais });
  else humanos.push(r);
}

console.log('=== CONTAS ===');
console.log('total:', recrutadores.length);
console.log('suspeitas de robô:', suspeitos.length);
console.log('restantes:', humanos.length);
console.log('  com vaga publicada:', humanos.filter((h) => h._count.jobs > 0).length);

console.log('\n=== AMOSTRA DAS SUSPEITAS (10 primeiras) ===');
for (const s of suspeitos.slice(0, 10)) {
  console.log(` ${s.created_at.toISOString().slice(0, 10)} | ${s.email} | "${s.name}" | ${s.sinais.join(', ')}`);
}

console.log('\n=== QUEM SOBRA, COM VAGA (é o público real) ===');
for (const h of humanos.filter((x) => x._count.jobs > 0)) {
  console.log(` ${h.created_at.toISOString().slice(0, 10)} | ${h.email} | "${h.name}" | ${h._count.jobs} vaga(s)`);
}

console.log('\n=== ASSINATURAS INCONSISTENTES ===');
const agora = new Date();
for (const s of assinaturas) {
  const vencida = s.current_period_end && s.current_period_end < agora;
  if (s.status === 'active' && vencida) {
    const dono = recrutadores.find((r) => r.id === s.recruiter_id);
    console.log(
      ` active mas vencida em ${s.current_period_end.toISOString().slice(0, 10)} | plano ${s.plan} | ${dono?.email ?? s.recruiter_id}`
    );
  }
}

await prisma.$disconnect();

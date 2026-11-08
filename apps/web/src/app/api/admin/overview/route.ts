import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';
import { PLANS, type PlanId } from '@/lib/subscription';
import { loadClassifiedAccounts } from '@/lib/admin-accounts';

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const now = new Date();
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  // Sequencial de propósito. O DATABASE_URL roda com pool pequeno (o pooler do
  // Supabase costuma vir com connection_limit=1), e um Promise.all de 12 consultas
  // estoura o pool e derruba o endpoint por timeout. São COUNTs rápidos: o custo de
  // rodar em fila é irrelevante perto de não responder.
  //
  // Só as CONTAS (donos), já separadas em real, interna (nossos testes) e robô. Sem
  // isso cada robô e cada conta de teste nossa entrava como cliente e os números do
  // painel eram ficção. Daqui para baixo, tudo é sobre as contas reais.
  const accounts = await loadClassifiedAccounts();
  const real = accounts.filter((a) => a.kind === 'real');
  const realIds = new Set(real.map((a) => a.id));
  // Vagas e candidaturas das contas internas ficam de fora; robô não tem vaga. Vaga
  // legada (user_id nulo) também: ela já não aparece para ninguém no portal.
  const internalIds = accounts.filter((a) => a.kind === 'internal').map((a) => a.id);
  const jobWhere = { deleted_at: null, user_id: { not: null, notIn: internalIds } };

  const recruitersTotal = real.length;
  const recruiters7d = real.filter((a) => a.created_at >= d7).length;
  const recruiters30d = real.filter((a) => a.created_at >= d30).length;
  const bots = accounts.filter((a) => a.kind === 'bot').length;
  const internal = internalIds.length;
  // Usuários de equipe, contados à parte: dizem quanto a feature está sendo usada.
  const teamMembersTotal = await prisma.recruiter.count({
    where: { account_owner_id: { in: [...realIds] } },
  });
  const jobsTotal = await prisma.job.count({ where: jobWhere });
  const jobsActive = await prisma.job.count({ where: { ...jobWhere, status: 'active' } });
  const candidatesTotal = await prisma.candidate.count({
    where: { deleted_at: null, job: jobWhere },
  });
  const candidates7d = await prisma.candidate.count({
    where: { deleted_at: null, job: jobWhere, created_at: { gte: d7 } },
  });
  const candidates30d = await prisma.candidate.count({
    where: { deleted_at: null, job: jobWhere, created_at: { gte: d30 } },
  });
  // Poucas centenas de linhas: filtrar em memória pelas contas reais sai mais simples
  // que repetir a lista de ids em cada consulta.
  const allSubs = await prisma.subscription.findMany({
    select: { recruiter_id: true, status: true, plan: true, trial_ends_at: true },
  });
  const subs = allSubs.filter((s) => realIds.has(s.recruiter_id));
  // Plano 'test' é cortesia nossa, não receita.
  const activeSubs = subs.filter((s) => s.status === 'active' && s.plan && s.plan !== 'test');
  // Trial que ainda vale mas vence nos próximos 7 dias: é a fila de conversão.
  const in7d = daysFromNow(7);
  const trialsExpiring7d = subs.filter(
    (s) => s.status === 'trialing' && s.trial_ends_at && s.trial_ends_at >= now && s.trial_ends_at <= in7d
  ).length;
  // Trial vencido e nunca convertido: conta perdida, ou a recuperar.
  const trialsExpired = subs.filter(
    (s) => s.status === 'trialing' && s.trial_ends_at && s.trial_ends_at < now
  ).length;

  // MRR é derivado do preço de tabela do plano, não do Stripe. Serve de ordem de
  // grandeza; desconto e cupom aplicados no Stripe não aparecem aqui.
  const planCounts: Record<string, number> = {};
  let mrr = 0;
  for (const sub of activeSubs) {
    const planId = sub.plan as PlanId;
    planCounts[planId] = (planCounts[planId] || 0) + 1;
    const plan = PLANS.find((p) => p.id === planId);
    if (plan) mrr += plan.price;
  }

  const statusCounts: Record<string, number> = {};
  for (const s of subs) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }

  return Response.json({
    recruiters: {
      total: recruitersTotal,
      last7d: recruiters7d,
      last30d: recruiters30d,
      teamMembers: teamMembersTotal,
      bots,
      internal,
    },
    jobs: { total: jobsTotal, active: jobsActive },
    candidates: { total: candidatesTotal, last7d: candidates7d, last30d: candidates30d },
    subscriptions: {
      byStatus: statusCounts,
      byPlan: planCounts,
      trialsExpiring7d,
      trialsExpired,
      mrr,
    },
  });
}

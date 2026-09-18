import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';
import { PLANS, type PlanId } from '@/lib/subscription';

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
  // account_owner_id: null = só as CONTAS. Sem este filtro, cada usuário convidado
  // entraria na contagem como se fosse cliente novo e inflaria a métrica de aquisição.
  const contasWhere = { account_owner_id: null };
  const recruitersTotal = await prisma.recruiter.count({ where: contasWhere });
  const recruiters7d = await prisma.recruiter.count({
    where: { ...contasWhere, created_at: { gte: d7 } },
  });
  const recruiters30d = await prisma.recruiter.count({
    where: { ...contasWhere, created_at: { gte: d30 } },
  });
  // Usuários de equipe, contados à parte: dizem quanto a feature está sendo usada.
  const teamMembersTotal = await prisma.recruiter.count({
    where: { account_owner_id: { not: null } },
  });
  const jobsTotal = await prisma.job.count({ where: { deleted_at: null } });
  const jobsActive = await prisma.job.count({ where: { deleted_at: null, status: 'active' } });
  const candidatesTotal = await prisma.candidate.count({ where: { deleted_at: null } });
  const candidates7d = await prisma.candidate.count({
    where: { deleted_at: null, created_at: { gte: d7 } },
  });
  const candidates30d = await prisma.candidate.count({
    where: { deleted_at: null, created_at: { gte: d30 } },
  });
  const subsByStatus = await prisma.subscription.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'active', plan: { not: null } },
    select: { plan: true },
  });
  // Trial que ainda vale mas vence nos próximos 7 dias: é a fila de conversão.
  const trialsExpiring7d = await prisma.subscription.count({
    where: { status: 'trialing', trial_ends_at: { gte: now, lte: daysFromNow(7) } },
  });
  // Trial vencido e nunca convertido: conta perdida, ou a recuperar.
  const trialsExpired = await prisma.subscription.count({
    where: { status: 'trialing', trial_ends_at: { lt: now } },
  });

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
  for (const row of subsByStatus) {
    statusCounts[row.status] = row._count._all;
  }

  return Response.json({
    recruiters: {
      total: recruitersTotal,
      last7d: recruiters7d,
      last30d: recruiters30d,
      teamMembers: teamMembersTotal,
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

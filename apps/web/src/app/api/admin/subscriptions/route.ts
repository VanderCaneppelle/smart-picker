import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';

const PAGE_SIZE = 25;

/**
 * Lista assinaturas com filtro por situação real, não só pelo campo status.
 * "trial_expiring" e "trial_expired" não existem como status no banco: são status
 * 'trialing' recortado por data, e é justamente esse recorte que interessa comercialmente.
 */
export async function GET(request: NextRequest) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const now = new Date();
  const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const where = (() => {
    switch (filter) {
      case 'active':
        return { status: 'active' };
      case 'trialing':
        return { status: 'trialing', trial_ends_at: { gte: now } };
      case 'trial_expiring':
        return { status: 'trialing', trial_ends_at: { gte: now, lte: in7d } };
      case 'trial_expired':
        return { status: 'trialing', trial_ends_at: { lt: now } };
      case 'problem':
        return { status: { in: ['past_due', 'unpaid', 'canceled'] } };
      default:
        return {};
    }
  })();

  // Sequencial: o pool do banco é pequeno, ver comentário em admin/overview.
  const total = await prisma.subscription.count({ where });
  const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: [{ trial_ends_at: 'asc' }, { created_at: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        plan: true,
        trial_ends_at: true,
        current_period_end: true,
        cancel_at_period_end: true,
        created_at: true,
        recruiter: { select: { id: true, name: true, email: true, company: true } },
      },
  });

  return Response.json({
    data: subscriptions,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

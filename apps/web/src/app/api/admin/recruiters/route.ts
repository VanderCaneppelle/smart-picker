import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  // A lista é de CONTAS. Usuários de equipe aparecem como contagem na linha da conta,
  // não como linha própria: eles não têm assinatura nem vaga em nome deles.
  const where = search
    ? {
        account_owner_id: null,
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : { account_owner_id: null };

  // Sequencial: o pool do banco é pequeno, ver comentário em admin/overview.
  const total = await prisma.recruiter.count({ where });
  const recruiters = await prisma.recruiter.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        created_at: true,
        subscription: {
          select: { status: true, plan: true, trial_ends_at: true, current_period_end: true },
        },
        _count: { select: { jobs: true, members: true } },
      },
  });

  // Candidaturas por recrutador em uma consulta agregada, em vez de uma por linha.
  const ids = recruiters.map((r) => r.id);
  const candidateCounts = ids.length
    ? await prisma.candidate.groupBy({
        by: ['job_id'],
        where: { deleted_at: null, job: { user_id: { in: ids } } },
        _count: { _all: true },
      })
    : [];

  const jobOwners = ids.length
    ? await prisma.job.findMany({
        where: { user_id: { in: ids } },
        select: { id: true, user_id: true },
      })
    : [];

  const ownerByJob = new Map(jobOwners.map((j) => [j.id, j.user_id]));
  const candidatesByRecruiter = new Map<string, number>();
  for (const row of candidateCounts) {
    const owner = ownerByJob.get(row.job_id);
    if (!owner) continue;
    candidatesByRecruiter.set(owner, (candidatesByRecruiter.get(owner) || 0) + row._count._all);
  }

  return Response.json({
    data: recruiters.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      company: r.company,
      created_at: r.created_at,
      jobs: r._count.jobs,
      // Usuários da conta = dono + convidados.
      users: 1 + r._count.members,
      candidates: candidatesByRecruiter.get(r.id) || 0,
      subscription: r.subscription
        ? {
            status: r.subscription.status,
            plan: r.subscription.plan,
            trial_ends_at: r.subscription.trial_ends_at,
            current_period_end: r.subscription.current_period_end,
          }
        : null,
    })),
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';
import { loadClassifiedAccounts, loadLastSignIns } from '@/lib/admin-accounts';
import type { AccountKind } from '@/lib/account-kind';

const PAGE_SIZE = 25;
const KINDS = ['real', 'internal', 'bot', 'all'] as const;
type KindFilter = (typeof KINDS)[number];

export async function GET(request: NextRequest) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const kindParam = searchParams.get('kind') as KindFilter | null;
  // Padrão "real": a lista abre mostrando só gente de verdade, que é o que importa.
  const kind: KindFilter = kindParam && KINDS.includes(kindParam) ? kindParam : 'real';

  // A lista é de CONTAS. Usuários de equipe aparecem como contagem na linha da conta,
  // não como linha própria: eles não têm assinatura nem vaga em nome deles.
  // Classifica tudo e pagina em memória: o filtro por tipo é heurística em JS.
  const accounts = await loadClassifiedAccounts(search);
  const counts: Record<AccountKind | 'all', number> = { real: 0, internal: 0, bot: 0, all: accounts.length };
  for (const a of accounts) counts[a.kind]++;

  const filtered = kind === 'all' ? accounts : accounts.filter((a) => a.kind === kind);
  const total = filtered.length;
  const pageAccounts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const ids = pageAccounts.map((a) => a.id);
  const kindById = new Map(pageAccounts.map((a) => [a.id, a.kind]));

  // Sequencial: o pool do banco é pequeno, ver comentário em admin/overview.
  const recruiters = ids.length
    ? await prisma.recruiter.findMany({
        where: { id: { in: ids } },
        orderBy: { created_at: 'desc' },
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
      })
    : [];

  // Candidaturas por recrutador em uma consulta agregada, em vez de uma por linha.
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

  const lastSignIns = await loadLastSignIns(ids);

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
      last_sign_in_at: lastSignIns.get(r.id) ?? null,
      kind: kindById.get(r.id) ?? 'real',
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
    counts,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

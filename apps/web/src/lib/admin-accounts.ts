import { prisma } from '@/lib/db';
import { accountKindResolver, isPaying, type AccountKind } from '@/lib/account-kind';

export interface ClassifiedAccount {
  id: string;
  email: string;
  name: string;
  company: string | null;
  created_at: Date;
  kind: AccountKind;
}

/**
 * Todas as CONTAS (donos), já classificadas. Carrega a lista inteira de propósito:
 * a classificação é heurística em JS, não dá para filtrar no banco, e são poucas
 * centenas de linhas leves. Se um dia passar de alguns milhares, vira coluna.
 */
export async function loadClassifiedAccounts(search = ''): Promise<ClassifiedAccount[]> {
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

  const rows = await prisma.recruiter.findMany({
    where,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      created_at: true,
      subscription: { select: { status: true, plan: true } },
      _count: { select: { jobs: true } },
    },
  });

  const kindOf = accountKindResolver();
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    company: r.company,
    created_at: r.created_at,
    kind: kindOf({
      email: r.email,
      name: r.name,
      company: r.company,
      jobs: r._count.jobs,
      paying: isPaying(r.subscription),
    }),
  }));
}

/**
 * Último login de cada id, lido de auth.users (Supabase Auth). O Recruiter.id É o id
 * do usuário no Auth, então não precisa de join por e-mail. Se a consulta falhar
 * (permissão no schema auth), a tela segue sem a coluna em vez de quebrar.
 */
export async function loadLastSignIns(ids: string[]): Promise<Map<string, Date | null>> {
  const map = new Map<string, Date | null>();
  if (ids.length === 0) return map;
  try {
    const rows = await prisma.$queryRaw<{ id: string; last_sign_in_at: Date | null }[]>`
      select id::text as id, last_sign_in_at
      from auth.users
      where id::text = any(${ids})
    `;
    for (const r of rows) map.set(r.id, r.last_sign_in_at);
  } catch (err) {
    console.error('admin: could not read auth.users.last_sign_in_at', err);
  }
  return map;
}

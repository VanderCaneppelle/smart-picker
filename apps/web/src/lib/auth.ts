import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';
import { prisma } from './db';
import {
  getMaxUsers,
  type PlanId,
  type SubscriptionStatus,
} from './subscription';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Contexto de uma requisição autenticada, já resolvido para a CONTA.
 *
 * `id` é quem está logado; `accountId` é o dono da conta. Numa conta sem equipe os
 * dois são iguais, que é o caso de todo mundo que já usava o produto.
 *
 * Regra de ouro: tudo que é dado de trabalho (vaga, candidato, assinatura, página
 * pública) se filtra por `accountId`. Só o que é pessoal (nome, telefone, idioma,
 * senha, candidatos salvos) se filtra por `id`. Usar `id` num filtro de vaga é o
 * bug que faz um membro não enxergar nada; usar `accountId` num filtro de perfil é
 * o bug que faz um membro editar o perfil do dono.
 */
export interface AuthContext {
  id: string;
  email: string;
  accountId: string;
  role: 'owner' | 'member';
  isOwner: boolean;
  mustChangePassword: boolean;
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return null;
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
    };
  } catch {
    return null;
  }
}

/**
 * Valida o token e resolve a conta. Uma consulta a mais por requisição (PK lookup),
 * sequencial de propósito: a DATABASE_URL roda com pgbouncer e connection_limit=1,
 * então paralelizar com Promise.all estoura o pool.
 *
 * Devolve null quando não há sessão válida. Para rotas que exigem sessão use
 * requireAccount, que já trata 401, 403 de senha pendente e 403 de assento.
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const user = await verifyAuth(request);
  if (!user) return null;

  const recruiter = await prisma.recruiter.findUnique({
    where: { id: user.id },
    select: { account_owner_id: true, role: true, must_change_password: true },
  });

  // Sem perfil ainda (login/checkout fazem o self-heal por e-mail). Tratar como dono
  // de si mesmo preserva exatamente o comportamento que existia antes da equipe.
  if (!recruiter) {
    return {
      id: user.id,
      email: user.email,
      accountId: user.id,
      role: 'owner',
      isOwner: true,
      mustChangePassword: false,
    };
  }

  const accountId = recruiter.account_owner_id ?? user.id;
  const isOwner = recruiter.account_owner_id === null;

  return {
    id: user.id,
    email: user.email,
    accountId,
    role: isOwner ? 'owner' : 'member',
    isOwner,
    mustChangePassword: recruiter.must_change_password,
  };
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json(
    { error: 'Unauthorized', message },
    { status: 401 }
  );
}

export function forbiddenResponse(code: string, message: string) {
  return Response.json(
    { error: 'Forbidden', code, message },
    { status: 403 }
  );
}

export interface RequireAccountOptions {
  /** Rota exclusiva do dono: cobrança, equipe e configuração pública da conta. */
  ownerOnly?: boolean;
  /**
   * Libera a rota para quem ainda tem senha provisória. Só a própria troca de senha
   * (e a leitura do próprio usuário) deve usar isto.
   */
  allowPendingPassword?: boolean;
}

type RequireAccountResult =
  | { ctx: AuthContext; response?: undefined }
  | { ctx?: undefined; response: Response };

/**
 * Porta de entrada das rotas autenticadas. Concentra os quatro jeitos de uma
 * requisição ser recusada, para nenhuma rota precisar lembrar deles:
 *
 *   401 sem sessão
 *   403 password_change_required  senha provisória ainda não trocada
 *   403 seat_blocked              membro acima do limite de assentos do plano
 *   403 owner_only                membro tentando mexer em cobrança ou equipe
 */
export async function requireAccount(
  request: NextRequest,
  options: RequireAccountOptions = {}
): Promise<RequireAccountResult> {
  const ctx = await getAuthContext(request);
  if (!ctx) return { response: unauthorizedResponse() };

  if (ctx.mustChangePassword && !options.allowPendingPassword) {
    return {
      response: forbiddenResponse(
        'password_change_required',
        'Defina uma nova senha para continuar.'
      ),
    };
  }

  if (options.ownerOnly && !ctx.isOwner) {
    return {
      response: forbiddenResponse(
        'owner_only',
        'Apenas o dono da conta pode fazer isso.'
      ),
    };
  }

  if (!ctx.isOwner) {
    const blocked = await isSeatBlocked(ctx);
    if (blocked) {
      return {
        response: forbiddenResponse(
          'seat_blocked',
          'A conta está acima do limite de usuários do plano. Fale com o dono da conta.'
        ),
      };
    }
  }

  return { ctx };
}

/**
 * Downgrade não apaga ninguém: os membros mais antigos que cabem no plano continuam,
 * o excedente perde acesso até o dono remover alguém ou voltar a subir de plano.
 * Ordenar por created_at é o que torna isso estável, sem depender de quem logou antes.
 *
 * Uma consulta só, e só para membro. Requisição de dono não paga nada por isto.
 */
export async function isSeatBlocked(ctx: AuthContext): Promise<boolean> {
  if (ctx.isOwner) return false;

  const account = await prisma.recruiter.findUnique({
    where: { id: ctx.accountId },
    select: {
      subscription: {
        select: { status: true, plan: true, trial_ends_at: true },
      },
      members: {
        select: { id: true },
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!account) return true;

  const maxUsers = getMaxUsers({
    status: (account.subscription?.status ?? 'canceled') as SubscriptionStatus,
    plan: (account.subscription?.plan ?? null) as PlanId | null,
    trialEndsAt: account.subscription?.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: null,
  });

  // O dono ocupa um assento, então sobram maxUsers - 1 para os membros.
  const seatsForMembers = Math.max(0, maxUsers - 1);
  const allowed = account.members.slice(0, seatsForMembers).map((m) => m.id);

  return !allowed.includes(ctx.id);
}

/**
 * A vaga pertence à CONTA, não à pessoa que a criou. Sem isso um membro abriria a
 * vaga da própria conta e levaria 404.
 */
export function jobBelongsToAccount(
  job: { user_id: string | null },
  ctx: { accountId: string }
): boolean {
  return job.user_id === ctx.accountId;
}

/** @deprecated Use jobBelongsToAccount. Mantido para chamadas antigas. */
export function jobBelongsToUser(job: { user_id: string | null }, user: AuthUser): boolean {
  return job.user_id === user.id;
}

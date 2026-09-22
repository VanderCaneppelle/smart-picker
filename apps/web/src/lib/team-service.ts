import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { ensureTrialSubscription } from '@/lib/subscription-service';
import {
  getMaxUsers,
  type PlanId,
  type SubscriptionStatus,
} from '@/lib/subscription';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'member';
  must_change_password: boolean;
  invite_email_sent_at: string | null;
  created_at: string;
  /** true = existe, mas está fora dos assentos do plano atual e não consegue entrar. */
  seat_blocked: boolean;
}

export interface SeatUsage {
  used: number;
  limit: number;
  canInvite: boolean;
  plan: PlanId | null;
  status: SubscriptionStatus;
}

export class TeamError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'TeamError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Alfabeto sem 0/O, 1/l/I: a senha vai ser lida de um e-mail e digitada à mão, e
 * caractere ambíguo nessa hora vira chamado de suporte.
 */
const ALFABETO = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePassword(length = 14): string {
  let senha = '';
  for (let i = 0; i < length; i++) {
    senha += ALFABETO[randomInt(ALFABETO.length)];
  }
  return senha;
}

async function getSeatContext(accountId: string) {
  const subscription = await ensureTrialSubscription(accountId);

  const limit = getMaxUsers({
    status: subscription.status as SubscriptionStatus,
    plan: subscription.plan as PlanId | null,
    trialEndsAt: subscription.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: null,
  });

  const members = await prisma.recruiter.findMany({
    where: { account_owner_id: accountId },
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      must_change_password: true,
      invite_email_sent_at: true,
      created_at: true,
    },
  });

  return { subscription, limit, members };
}

export async function getSeatUsage(accountId: string): Promise<SeatUsage> {
  const { subscription, limit, members } = await getSeatContext(accountId);

  // O dono conta como assento: 1 (ele) + membros.
  const used = 1 + members.length;

  return {
    used,
    limit,
    canInvite: used < limit,
    plan: subscription.plan as PlanId | null,
    status: subscription.status as SubscriptionStatus,
  };
}

export async function listTeam(accountId: string): Promise<{
  owner: TeamMember;
  members: TeamMember[];
  seats: SeatUsage;
}> {
  const { subscription, limit, members } = await getSeatContext(accountId);

  const owner = await prisma.recruiter.findUnique({
    where: { id: accountId },
    select: { id: true, email: true, name: true, created_at: true },
  });

  if (!owner) {
    throw new TeamError('account_not_found', 'Conta não encontrada.', 404);
  }

  const seatsForMembers = Math.max(0, limit - 1);

  return {
    owner: {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: 'owner',
      must_change_password: false,
      invite_email_sent_at: null,
      created_at: owner.created_at.toISOString(),
      seat_blocked: false,
    },
    members: members.map((m, index) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      role: 'member' as const,
      must_change_password: m.must_change_password,
      invite_email_sent_at: m.invite_email_sent_at?.toISOString() ?? null,
      created_at: m.created_at.toISOString(),
      // Mesma ordenação de isSeatBlocked (created_at asc), para a tela mostrar
      // exatamente quem o login vai barrar.
      seat_blocked: index >= seatsForMembers,
    })),
    seats: {
      used: 1 + members.length,
      limit,
      canInvite: 1 + members.length < limit,
      plan: subscription.plan as PlanId | null,
      status: subscription.status as SubscriptionStatus,
    },
  };
}

export interface CreatedMember {
  member: TeamMember;
  /** Senha provisória em claro. Só existe nesta resposta, nunca é gravada. */
  password: string;
}

export async function createMember(params: {
  accountId: string;
  email: string;
  name: string;
}): Promise<CreatedMember> {
  const { accountId } = params;
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();

  if (!supabaseAdmin) {
    throw new TeamError('auth_unavailable', 'Serviço de autenticação indisponível.', 503);
  }

  const seats = await getSeatUsage(accountId);
  if (!seats.canInvite) {
    throw new TeamError(
      'seat_limit_reached',
      `O plano atual permite ${seats.limit} ${seats.limit === 1 ? 'usuário' : 'usuários'}.`,
      402
    );
  }

  const existing = await prisma.recruiter.findUnique({ where: { email } });
  if (existing) {
    throw new TeamError(
      'email_in_use',
      'Este e-mail já tem conta no Rankea. Use outro endereço.',
      409
    );
  }

  const password = generatePassword();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    // Confirmado na hora: quem cria é o dono da conta, e o membro precisa entrar
    // direto com a senha provisória, sem passo de confirmação no caminho.
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data.user) {
    throw new TeamError(
      'auth_create_failed',
      error?.message ?? 'Falha ao criar o usuário.',
      400
    );
  }

  const ownerLocale = await prisma.recruiter.findUnique({
    where: { id: accountId },
    select: { locale: true, company: true },
  });

  try {
    const created = await prisma.recruiter.create({
      data: {
        id: data.user.id,
        email,
        name,
        company: ownerLocale?.company ?? null,
        locale: ownerLocale?.locale ?? 'pt',
        account_owner_id: accountId,
        role: 'member',
        must_change_password: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        must_change_password: true,
        invite_email_sent_at: true,
        created_at: true,
      },
    });

    return {
      member: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: 'member',
        must_change_password: created.must_change_password,
        invite_email_sent_at: null,
        created_at: created.created_at.toISOString(),
        seat_blocked: false,
      },
      password,
    };
  } catch (err) {
    // O usuário do Supabase já existe neste ponto. Sem desfazer, o e-mail fica
    // ocupado no Auth sem perfil nenhum e o dono não consegue nem tentar de novo.
    await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => {});
    throw err;
  }
}

export async function removeMember(accountId: string, memberId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new TeamError('auth_unavailable', 'Serviço de autenticação indisponível.', 503);
  }

  const member = await prisma.recruiter.findUnique({
    where: { id: memberId },
    select: { account_owner_id: true },
  });

  // Confere o dono antes de apagar: sem isto, um id de outra conta apagaria membro
  // alheio. E o dono nunca pode ser removido por esta rota.
  if (!member || member.account_owner_id !== accountId) {
    throw new TeamError('member_not_found', 'Usuário não encontrado nesta conta.', 404);
  }

  await prisma.recruiter.delete({ where: { id: memberId } });
  await supabaseAdmin.auth.admin.deleteUser(memberId).catch((err) => {
    // Perfil já foi. Deixar log em vez de estourar: o assento foi liberado, que é o
    // que o dono pediu, e um usuário órfão no Auth não consegue mais entrar.
    console.error('[Team] Falha ao remover usuário do Supabase Auth:', err);
  });
}

/** Gera uma senha nova para o membro e reativa a troca obrigatória. */
export async function resetMemberPassword(
  accountId: string,
  memberId: string
): Promise<{ member: TeamMember; password: string }> {
  if (!supabaseAdmin) {
    throw new TeamError('auth_unavailable', 'Serviço de autenticação indisponível.', 503);
  }

  const member = await prisma.recruiter.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      email: true,
      name: true,
      account_owner_id: true,
      created_at: true,
    },
  });

  if (!member || member.account_owner_id !== accountId) {
    throw new TeamError('member_not_found', 'Usuário não encontrado nesta conta.', 404);
  }

  const password = generatePassword();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(memberId, { password });
  if (error) {
    throw new TeamError('auth_update_failed', error.message, 400);
  }

  const updated = await prisma.recruiter.update({
    where: { id: memberId },
    data: { must_change_password: true, invite_email_sent_at: null },
    select: { must_change_password: true, invite_email_sent_at: true },
  });

  return {
    member: {
      id: member.id,
      email: member.email,
      name: member.name,
      role: 'member',
      must_change_password: updated.must_change_password,
      invite_email_sent_at: null,
      created_at: member.created_at.toISOString(),
      seat_blocked: false,
    },
    password,
  };
}

export async function markInviteSent(memberId: string): Promise<void> {
  await prisma.recruiter.update({
    where: { id: memberId },
    data: { invite_email_sent_at: new Date() },
  });
}

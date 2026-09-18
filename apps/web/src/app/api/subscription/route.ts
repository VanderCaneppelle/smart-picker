import { NextRequest } from 'next/server';
import { requireAccount } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ensureTrialSubscription, getSubscriptionByRecruiterId } from '@/lib/subscription-service';

async function findOrSyncRecruiter(authId: string, email: string) {
  let recruiter = await prisma.recruiter.findUnique({ where: { id: authId } });

  if (!recruiter) {
    recruiter = await prisma.recruiter.findUnique({ where: { email } });

    if (recruiter) {
      console.log('[Subscription] Found recruiter by email, syncing ID:', recruiter.id, '->', authId);
      recruiter = await prisma.recruiter.update({
        where: { email },
        data: { id: authId },
      });
    }
  }

  return recruiter;
}

export async function GET(request: NextRequest) {
  const auth = await requireAccount(request);
  if (auth.response) return auth.response;
  const ctx = auth.ctx;

  // Leitura liberada para membro: o layout do dashboard depende dela para decidir
  // banner de trial e paywall. Quem não pode é ASSINAR (checkout e portal são do
  // dono). O self-heal por e-mail só faz sentido para dono, porque o membro sempre
  // foi criado com o id do Supabase Auth.
  const recruiter = ctx.isOwner
    ? await findOrSyncRecruiter(ctx.id, ctx.email)
    : await prisma.recruiter.findUnique({ where: { id: ctx.accountId } });

  if (!recruiter) {
    return Response.json({
      status: 'trialing',
      plan: null,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: null,
    });
  }

  let subscription = await getSubscriptionByRecruiterId(recruiter.id);
  if (!subscription) {
    subscription = await ensureTrialSubscription(recruiter.id);
  }

  return Response.json({
    status: subscription.status,
    plan: subscription.plan,
    trialEndsAt: subscription.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: subscription.current_period_end?.toISOString() ?? null,
  });
}

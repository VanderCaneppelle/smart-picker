import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  console.log('[Subscription] Looking up recruiter:', user.id, user.email);

  const recruiter = await prisma.recruiter.findUnique({
    where: { id: user.id },
    select: {
      subscription_status: true,
      subscription_plan: true,
      trial_ends_at: true,
      subscription_current_period_end: true,
    },
  });

  if (!recruiter) {
    console.warn('[Subscription] Recruiter not found for user:', user.id, '- creating with trial defaults');
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const created = await prisma.recruiter.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0],
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt,
      },
      update: {},
    });

    return Response.json({
      status: created.subscription_status,
      plan: created.subscription_plan,
      trialEndsAt: created.trial_ends_at?.toISOString() ?? null,
      currentPeriodEnd: created.subscription_current_period_end?.toISOString() ?? null,
    });
  }

  return Response.json({
    status: recruiter.subscription_status,
    plan: recruiter.subscription_plan,
    trialEndsAt: recruiter.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: recruiter.subscription_current_period_end?.toISOString() ?? null,
  });
}

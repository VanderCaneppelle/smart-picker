import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  console.log('[Subscription] Looking up recruiter:', user.id, user.email);

  const recruiter = await findOrSyncRecruiter(user.id, user.email);

  if (!recruiter) {
    return Response.json({
      status: 'trialing',
      plan: null,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: null,
    });
  }

  return Response.json({
    status: recruiter.subscription_status,
    plan: recruiter.subscription_plan,
    trialEndsAt: recruiter.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: recruiter.subscription_current_period_end?.toISOString() ?? null,
  });
}

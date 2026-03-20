import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

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
    return Response.json(
      { error: 'Not Found', message: 'Recruiter not found' },
      { status: 404 }
    );
  }

  return Response.json({
    status: recruiter.subscription_status,
    plan: recruiter.subscription_plan,
    trialEndsAt: recruiter.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: recruiter.subscription_current_period_end?.toISOString() ?? null,
  });
}

import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getActiveJobsLimit } from '@/lib/subscription-service';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  const info = await getActiveJobsLimit(user.id);

  return Response.json({
    current: info.current,
    limit: Number.isFinite(info.limit) ? info.limit : null,
    canCreate: info.canCreate,
    plan: info.plan,
    status: info.status,
  });
}

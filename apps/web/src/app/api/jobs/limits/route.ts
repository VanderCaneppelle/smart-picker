import { NextRequest } from 'next/server';
import { requireAccount } from '@/lib/auth';
import { getActiveJobsLimit } from '@/lib/subscription-service';

export async function GET(request: NextRequest) {
  const auth = await requireAccount(request);
  if (auth.response) return auth.response;

  const info = await getActiveJobsLimit(auth.ctx.accountId);

  return Response.json({
    current: info.current,
    limit: Number.isFinite(info.limit) ? info.limit : null,
    canCreate: info.canCreate,
    plan: info.plan,
    status: info.status,
  });
}

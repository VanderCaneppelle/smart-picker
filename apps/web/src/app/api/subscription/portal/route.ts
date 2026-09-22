import { NextRequest } from 'next/server';
import { requireAccount } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getSubscriptionByRecruiterId } from '@/lib/subscription-service';

export async function POST(request: NextRequest) {
  const auth = await requireAccount(request, { ownerOnly: true });
  if (auth.response) return auth.response;

  const subscription = await getSubscriptionByRecruiterId(auth.ctx.accountId);

  if (!subscription?.stripe_customer_id) {
    return Response.json(
      { error: 'Bad Request', message: 'No Stripe customer found. Subscribe first.' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${appUrl}/dashboard`,
  });

  return Response.json({ url: session.url });
}

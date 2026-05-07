import { NextRequest } from 'next/server';
import { stripe, PRICE_LOOKUP_KEYS, getPriceByLookupKey } from '@/lib/stripe';
import type { PlanId } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const planId = body.planId as PlanId;

  if (!planId || !PRICE_LOOKUP_KEYS[planId]) {
    return Response.json(
      { error: 'Bad Request', message: 'Invalid plan' },
      { status: 400 }
    );
  }

  const lookupKey = PRICE_LOOKUP_KEYS[planId];
  const price = await getPriceByLookupKey(lookupKey);

  if (!price) {
    return Response.json(
      { error: 'Not Found', message: 'Price not found for plan.' },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${appUrl}/signup?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
    subscription_data: {
      metadata: {
        plan_id: planId,
        pre_signup: '1',
      },
    },
    metadata: {
      plan_id: planId,
      pre_signup: '1',
    },
  });

  return Response.json({ url: session.url });
}

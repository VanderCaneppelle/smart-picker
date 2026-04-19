import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, PRICE_LOOKUP_KEYS, getOrCreateStripeCustomer, getPriceByLookupKey } from '@/lib/stripe';
import type { PlanId } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const planId = body.planId as PlanId;

  if (!planId || !PRICE_LOOKUP_KEYS[planId]) {
    return Response.json(
      { error: 'Bad Request', message: 'Invalid plan' },
      { status: 400 }
    );
  }

  console.log('[Checkout] Looking up recruiter:', user.id, user.email);

  let recruiter = await prisma.recruiter.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, stripe_customer_id: true },
  });

  if (!recruiter) {
    const byEmail = await prisma.recruiter.findUnique({
      where: { email: user.email },
      select: { id: true, name: true, email: true, stripe_customer_id: true },
    });

    if (byEmail) {
      console.log('[Checkout] Found recruiter by email, syncing ID:', byEmail.id, '->', user.id);
      recruiter = await prisma.recruiter.update({
        where: { email: user.email },
        data: { id: user.id },
      });
    } else {
      console.warn('[Checkout] Recruiter not found, creating for user:', user.id);
      recruiter = await prisma.recruiter.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
          subscription_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  let customerId = recruiter.stripe_customer_id;

  if (!customerId) {
    customerId = await getOrCreateStripeCustomer(
      recruiter.email,
      recruiter.name,
      user.id
    );

    await prisma.recruiter.update({
      where: { id: user.id },
      data: { stripe_customer_id: customerId },
    });
  }

  const lookupKey = PRICE_LOOKUP_KEYS[planId];
  console.log('[Checkout] Looking up price with key:', lookupKey);

  let price;
  try {
    price = await getPriceByLookupKey(lookupKey);
  } catch (error) {
    console.error('[Checkout] Error fetching price:', error);
    return Response.json(
      { error: 'Stripe Error', message: error instanceof Error ? error.message : 'Failed to fetch price' },
      { status: 500 }
    );
  }

  if (!price) {
    console.error('[Checkout] Price not found for lookup key:', lookupKey);
    return Response.json(
      { error: 'Not Found', message: 'Price not found. Run setup-stripe-products script.' },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/dashboard?subscription=canceled`,
    subscription_data: {
      metadata: {
        recruiter_id: user.id,
        plan_id: planId,
      },
    },
    metadata: {
      recruiter_id: user.id,
      plan_id: planId,
    },
  });

  return Response.json({ url: session.url });
}

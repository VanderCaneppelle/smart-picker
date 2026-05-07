import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import {
  handleCheckoutCompleted,
  handleStripeSubscriptionUpdated,
  handleStripeSubscriptionDeleted,
  handleStripePaymentFailed,
} from '@/lib/subscription-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Webhook] Signature verification failed:', msg);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[Webhook] Received event:', event.type, event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleStripeSubscriptionUpdated(event, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleStripeSubscriptionDeleted(event, event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handleStripePaymentFailed(event, event.data.object as Stripe.Invoice);
        break;

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Handler error for ${event.type}:`, err);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

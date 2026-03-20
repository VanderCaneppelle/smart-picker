import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === 'whsec_placeholder') {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[Webhook] Received event:', event.type, event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        await handlePaymentFailed(event.data.object as unknown as Record<string, unknown>);
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return Response.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const firstItem = subscription.items?.data?.[0];
  if (firstItem?.current_period_end) {
    return new Date(firstItem.current_period_end * 1000);
  }
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const recruiterId = session.metadata?.recruiter_id;
  const planId = session.metadata?.plan_id;

  console.log('[Webhook] checkout.session.completed', { sessionId: session.id, recruiterId, planId });

  if (!recruiterId || !planId) {
    console.warn('[Webhook] Checkout session missing metadata:', session.id);
    return;
  }

  if (session.subscription) {
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id;

    console.log('[Webhook] Retrieving subscription:', subscriptionId);

    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data'],
    });

    const periodEnd = getSubscriptionPeriodEnd(sub);

    console.log('[Webhook] Updating recruiter:', recruiterId, { status: 'active', plan: planId, periodEnd });

    await prisma.recruiter.update({
      where: { id: recruiterId },
      data: {
        subscription_status: 'active',
        subscription_plan: planId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id:
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? undefined,
        subscription_current_period_end: periodEnd,
      },
    });

    console.log('[Webhook] Recruiter updated successfully');
  } else {
    console.warn('[Webhook] Checkout session has no subscription:', session.id);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const recruiterId = subscription.metadata?.recruiter_id;
  if (!recruiterId) {
    const recruiter = await prisma.recruiter.findFirst({
      where: { stripe_subscription_id: subscription.id },
      select: { id: true },
    });
    if (!recruiter) return;
    await updateSubscriptionData(recruiter.id, subscription);
    return;
  }

  await updateSubscriptionData(recruiterId, subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const recruiter = await prisma.recruiter.findFirst({
    where: { stripe_subscription_id: subscription.id },
    select: { id: true },
  });

  if (!recruiter) return;

  await prisma.recruiter.update({
    where: { id: recruiter.id },
    data: {
      subscription_status: 'canceled',
      subscription_plan: null,
      subscription_current_period_end: null,
    },
  });
}

async function handlePaymentFailed(invoice: Record<string, unknown>) {
  const subscriptionRef = invoice.subscription;
  if (!subscriptionRef) return;

  const subId =
    typeof subscriptionRef === 'string'
      ? subscriptionRef
      : (subscriptionRef as { id: string }).id;

  const recruiter = await prisma.recruiter.findFirst({
    where: { stripe_subscription_id: subId },
    select: { id: true },
  });

  if (!recruiter) return;

  await prisma.recruiter.update({
    where: { id: recruiter.id },
    data: { subscription_status: 'past_due' },
  });
}

async function updateSubscriptionData(
  recruiterId: string,
  subscription: Stripe.Subscription
) {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    paused: 'canceled',
  };

  const planId = subscription.metadata?.plan_id ?? null;
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await prisma.recruiter.update({
    where: { id: recruiterId },
    data: {
      subscription_status: statusMap[subscription.status] ?? subscription.status,
      subscription_plan: planId,
      subscription_current_period_end: periodEnd,
    },
  });
}

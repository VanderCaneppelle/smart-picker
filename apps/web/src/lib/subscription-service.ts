import type { Prisma, Subscription } from '@prisma/client';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { TRIAL_DURATION_DAYS, type PlanId, type SubscriptionStatus } from '@/lib/subscription';

const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  incomplete: 'past_due',
  incomplete_expired: 'canceled',
  paused: 'canceled',
};

function getStripePeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = subscription.items?.data?.[0];
  return {
    start: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
    end: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
  };
}

export async function ensureTrialSubscription(recruiterId: string): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({
    where: { recruiter_id: recruiterId },
  });
  if (existing) return existing;

  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const created = await prisma.subscription.create({
    data: {
      recruiter_id: recruiterId,
      status: 'trialing',
      trial_started_at: new Date(),
      trial_ends_at: trialEndsAt,
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscription_id: created.id,
      event_type: 'trial_started',
      to_status: 'trialing',
      metadata: { trial_ends_at: trialEndsAt.toISOString() },
    },
  });

  await prisma.recruiter.update({
    where: { id: recruiterId },
    data: {
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt,
    },
  });

  return created;
}

export async function getSubscriptionByRecruiterId(recruiterId: string): Promise<Subscription | null> {
  return prisma.subscription.findUnique({ where: { recruiter_id: recruiterId } });
}

async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  return prisma.subscription.findUnique({
    where: { stripe_subscription_id: stripeSubscriptionId },
  });
}

async function isStripeEventProcessed(stripeEventId: string): Promise<boolean> {
  const existing = await prisma.subscriptionEvent.findUnique({
    where: { stripe_event_id: stripeEventId },
  });
  return existing !== null;
}

async function applySubscriptionUpdate(params: {
  subscription: Subscription;
  stripeEventId: string;
  eventType: string;
  nextData: Prisma.SubscriptionUpdateInput;
  recruiterMirror: Prisma.RecruiterUpdateInput;
}): Promise<Subscription> {
  const { subscription, stripeEventId, eventType, nextData, recruiterMirror } = params;

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: nextData,
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscription_id: subscription.id,
      event_type: eventType,
      stripe_event_id: stripeEventId,
      from_status: subscription.status,
      to_status: updated.status,
      from_plan: subscription.plan,
      to_plan: updated.plan,
    },
  });

  await prisma.recruiter.update({
    where: { id: subscription.recruiter_id },
    data: recruiterMirror,
  });

  return updated;
}

export async function reconcileFromCheckoutSession(
  recruiterId: string,
  stripeSessionId: string
): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
    expand: ['subscription.items.data', 'customer'],
  });

  if (!session.subscription) return;

  const planId = session.metadata?.plan_id as PlanId | undefined;
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  const stripeSub =
    typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ['items.data'] })
      : session.subscription;

  const period = getStripePeriod(stripeSub);
  const priceId = stripeSub.items?.data?.[0]?.price?.id ?? null;

  const subscription = await ensureTrialSubscription(recruiterId);

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      plan: planId ?? subscription.plan,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: priceId,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: false,
      canceled_at: null,
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscription_id: subscription.id,
      event_type: 'activated',
      from_status: subscription.status,
      to_status: updated.status,
      from_plan: subscription.plan,
      to_plan: updated.plan,
      metadata: { source: 'pre_signup_checkout', stripe_session_id: stripeSessionId },
    },
  });

  await prisma.recruiter.update({
    where: { id: recruiterId },
    data: {
      subscription_status: 'active',
      subscription_plan: planId ?? subscription.plan,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId ?? undefined,
      subscription_current_period_end: period.end,
    },
  });
}

export async function handleCheckoutCompleted(
  stripeEvent: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<void> {
  if (await isStripeEventProcessed(stripeEvent.id)) return;

  const recruiterId = session.metadata?.recruiter_id;
  const planId = session.metadata?.plan_id as PlanId | undefined;

  // Pre-signup checkout: reconciliação acontece no /api/auth/signup após criar o recruiter
  if (!recruiterId) return;

  if (!planId || !session.subscription) return;

  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data'],
  });

  const period = getStripePeriod(stripeSub);
  const priceId = stripeSub.items?.data?.[0]?.price?.id ?? null;

  const subscription = await ensureTrialSubscription(recruiterId);

  await applySubscriptionUpdate({
    subscription,
    stripeEventId: stripeEvent.id,
    eventType: subscription.plan ? 'upgraded' : 'activated',
    nextData: {
      status: 'active',
      plan: planId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: priceId,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: false,
      canceled_at: null,
    },
    recruiterMirror: {
      subscription_status: 'active',
      subscription_plan: planId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId ?? undefined,
      subscription_current_period_end: period.end,
    },
  });
}

export async function handleStripeSubscriptionUpdated(
  stripeEvent: Stripe.Event,
  stripeSub: Stripe.Subscription
): Promise<void> {
  if (await isStripeEventProcessed(stripeEvent.id)) return;

  let subscription = await getSubscriptionByStripeSubscriptionId(stripeSub.id);

  if (!subscription) {
    const recruiterId = stripeSub.metadata?.recruiter_id;
    if (!recruiterId) return;
    subscription = await ensureTrialSubscription(recruiterId);
  }

  const status = STRIPE_STATUS_MAP[stripeSub.status] ?? (stripeSub.status as SubscriptionStatus);
  const planId = (stripeSub.metadata?.plan_id as PlanId | undefined) ?? subscription.plan;
  const period = getStripePeriod(stripeSub);
  const priceId = stripeSub.items?.data?.[0]?.price?.id ?? subscription.stripe_price_id;

  const eventType =
    subscription.plan && planId && subscription.plan !== planId
      ? planRank(planId) > planRank(subscription.plan)
        ? 'upgraded'
        : 'downgraded'
      : stripeSub.cancel_at_period_end
        ? 'canceled'
        : status === 'active' && subscription.status !== 'active'
          ? 'reactivated'
          : 'renewed';

  await applySubscriptionUpdate({
    subscription,
    stripeEventId: stripeEvent.id,
    eventType,
    nextData: {
      status,
      plan: planId ?? null,
      stripe_subscription_id: stripeSub.id,
      stripe_price_id: priceId,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: stripeSub.cancel_at_period_end ?? false,
    },
    recruiterMirror: {
      subscription_status: status,
      subscription_plan: planId ?? null,
      subscription_current_period_end: period.end,
    },
  });
}

export async function handleStripeSubscriptionDeleted(
  stripeEvent: Stripe.Event,
  stripeSub: Stripe.Subscription
): Promise<void> {
  if (await isStripeEventProcessed(stripeEvent.id)) return;

  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSub.id);
  if (!subscription) return;

  await applySubscriptionUpdate({
    subscription,
    stripeEventId: stripeEvent.id,
    eventType: 'canceled',
    nextData: {
      status: 'canceled',
      plan: null,
      current_period_end: null,
      canceled_at: new Date(),
    },
    recruiterMirror: {
      subscription_status: 'canceled',
      subscription_plan: null,
      subscription_current_period_end: null,
    },
  });
}

export async function handleStripePaymentFailed(
  stripeEvent: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<void> {
  if (await isStripeEventProcessed(stripeEvent.id)) return;

  const subRef = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  if (!subRef) return;

  const stripeSubscriptionId = typeof subRef === 'string' ? subRef : subRef.id;
  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);
  if (!subscription) return;

  await applySubscriptionUpdate({
    subscription,
    stripeEventId: stripeEvent.id,
    eventType: 'payment_failed',
    nextData: { status: 'past_due' },
    recruiterMirror: { subscription_status: 'past_due' },
  });
}

function planRank(plan: string | null): number {
  if (plan === 'starter') return 1;
  if (plan === 'professional') return 2;
  if (plan === 'enterprise') return 3;
  return 0;
}

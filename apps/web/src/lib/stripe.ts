import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as Record<string | symbol, unknown>)[prop];
  },
});

export const PRICE_LOOKUP_KEYS = {
  starter: 'rankea_starter_monthly',
  professional: 'rankea_professional_monthly',
  enterprise: 'rankea_enterprise_monthly',
} as const;

export async function getPriceByLookupKey(lookupKey: string): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return prices.data[0] ?? null;
}

export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  recruiterId: string
): Promise<string> {
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { recruiter_id: recruiterId },
  });

  return customer.id;
}

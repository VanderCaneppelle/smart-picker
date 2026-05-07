/**
 * Script to setup Stripe products and prices for Rankea.
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-products.ts
 *
 * Requires STRIPE_SECRET_KEY in .env.local (apps/web)
 */

import 'dotenv/config';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY. Set it in apps/web/.env.local and run from project root.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { typescript: true });

const plans = [
  {
    name: 'Rankea Starter',
    description: 'Para recrutadores autônomos começando. Até 3 vagas ativas.',
    priceInCents: 9700,
    lookupKey: 'rankea_starter_monthly',
    metadata: { plan_id: 'starter', max_active_jobs: '3' },
  },
  {
    name: 'Rankea Profissional',
    description: 'Para consultorias e recrutadores em crescimento. Até 10 vagas ativas.',
    priceInCents: 19700,
    lookupKey: 'rankea_professional_monthly',
    metadata: { plan_id: 'professional', max_active_jobs: '10' },
  },
  {
    name: 'Rankea Empresarial',
    description: 'Para equipes e operações de alto volume. Vagas ilimitadas.',
    priceInCents: 39700,
    lookupKey: 'rankea_enterprise_monthly',
    metadata: { plan_id: 'enterprise', max_active_jobs: 'unlimited' },
  },
];

async function main() {
  console.log('Setting up Stripe products and prices...\n');

  for (const plan of plans) {
    // Check if product already exists by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${plan.metadata.plan_id}'`,
    });

    let product: Stripe.Product;

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`Product "${plan.name}" already exists: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: plan.metadata,
      });
      console.log(`Created product "${plan.name}": ${product.id}`);
    }

    // Check if price with lookup_key exists
    const existingPrices = await stripe.prices.list({
      lookup_keys: [plan.lookupKey],
      limit: 1,
    });

    if (existingPrices.data.length > 0) {
      const price = existingPrices.data[0];
      console.log(`  Price already exists: ${price.id} (${plan.lookupKey}) — R$${plan.priceInCents / 100}/month`);
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceInCents,
        currency: 'brl',
        recurring: { interval: 'month' },
        lookup_key: plan.lookupKey,
        transfer_lookup_key: true,
      });
      console.log(`  Created price: ${price.id} (${plan.lookupKey}) — R$${plan.priceInCents / 100}/month`);
    }

    console.log('');
  }

  console.log('Done! Products and prices are ready.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

/**
 * Script to configure Stripe Billing Portal for Rankea.
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-branding.ts
 *
 * Requires STRIPE_SECRET_KEY in env.
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { typescript: true });

const LOOKUP_KEYS = [
  'rankea_starter_monthly',
  'rankea_professional_monthly',
  'rankea_enterprise_monthly',
];

async function main() {
  console.log('Configuring Stripe Billing Portal for Rankea...\n');

  // Fetch all price IDs by lookup key
  const prices = await stripe.prices.list({
    lookup_keys: LOOKUP_KEYS,
    active: true,
    expand: ['data.product'],
  });

  if (prices.data.length === 0) {
    console.error('No prices found! Run setup-stripe-products.ts first.');
    process.exit(1);
  }

  // Group prices by product for the portal config
  const productPriceMap = new Map<string, string[]>();
  for (const price of prices.data) {
    const productId = typeof price.product === 'string' ? price.product : price.product.id;
    if (!productPriceMap.has(productId)) {
      productPriceMap.set(productId, []);
    }
    productPriceMap.get(productId)!.push(price.id);
  }

  const products = Array.from(productPriceMap.entries()).map(([product, priceIds]) => ({
    product,
    prices: priceIds,
  }));

  console.log(`Found ${prices.data.length} prices across ${products.length} products.\n`);

  const portalFeatures: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
    subscription_cancel: { enabled: true, mode: 'at_period_end' },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products,
    },
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true },
  };

  try {
    const portalConfigs = await stripe.billingPortal.configurations.list({ limit: 1 });

    if (portalConfigs.data.length > 0) {
      await stripe.billingPortal.configurations.update(portalConfigs.data[0].id, {
        business_profile: {
          headline: 'Rankea — Gerencie sua assinatura',
        },
        features: portalFeatures as Stripe.BillingPortal.ConfigurationUpdateParams.Features,
      });
      console.log('Billing Portal configuration updated.');
    } else {
      await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Rankea — Gerencie sua assinatura',
          privacy_policy_url: 'https://rankea.ai/privacidade',
          terms_of_service_url: 'https://rankea.ai/termos',
        },
        features: portalFeatures,
      });
      console.log('Billing Portal configuration created.');
    }
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }

  console.log('\nDone! Billing Portal is configured.');
  console.log('\n--- MANUAL: Customize Checkout & Portal colors ---');
  console.log('1. Go to: https://dashboard.stripe.com/test/settings/branding');
  console.log('2. Set brand color to: #059669 (emerald)');
  console.log('3. Set accent color to: #0d9488 (teal)');
  console.log('4. Upload Rankea icon + logo');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

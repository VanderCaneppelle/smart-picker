-- Add subscription fields to Recruiter table
ALTER TABLE "Recruiter"
  ADD COLUMN IF NOT EXISTS "subscription_status" TEXT NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "subscription_plan" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT,
  ADD COLUMN IF NOT EXISTS "subscription_current_period_end" TIMESTAMPTZ;

-- Set trial_ends_at for existing users (30 days from now)
UPDATE "Recruiter"
SET "trial_ends_at" = NOW() + INTERVAL '30 days'
WHERE "trial_ends_at" IS NULL;

-- Unique indexes for Stripe IDs
CREATE UNIQUE INDEX IF NOT EXISTS "Recruiter_stripe_customer_id_key" ON "Recruiter"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Recruiter_stripe_subscription_id_key" ON "Recruiter"("stripe_subscription_id");

-- Index for subscription_status queries
CREATE INDEX IF NOT EXISTS "Recruiter_subscription_status_idx" ON "Recruiter"("subscription_status");
CREATE INDEX IF NOT EXISTS "Recruiter_stripe_customer_id_idx" ON "Recruiter"("stripe_customer_id");

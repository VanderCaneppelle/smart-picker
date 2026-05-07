-- Separa subscription em tabela dedicada.
-- Idempotente: pode ser rodado multiplas vezes sem efeitos colaterais.
-- Estratégia: cria novas tabelas + faz backfill. Campos antigos em "Recruiter"
-- sao mantidos (dual-write) até rollout completo.

-- =========================================================================
-- 1. Tabela Subscription (1:1 com Recruiter)
-- =========================================================================
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"                      TEXT PRIMARY KEY,
  "recruiter_id"            TEXT NOT NULL UNIQUE,
  "status"                  TEXT NOT NULL DEFAULT 'trialing',
  "plan"                    TEXT,
  "trial_started_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "trial_ends_at"           TIMESTAMPTZ,
  "stripe_customer_id"      TEXT,
  "stripe_subscription_id"  TEXT,
  "stripe_price_id"         TEXT,
  "current_period_start"    TIMESTAMPTZ,
  "current_period_end"      TIMESTAMPTZ,
  "cancel_at_period_end"    BOOLEAN NOT NULL DEFAULT FALSE,
  "canceled_at"             TIMESTAMPTZ,
  "created_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Subscription_recruiter_id_fkey"
    FOREIGN KEY ("recruiter_id") REFERENCES "Recruiter"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_recruiter_id_key"
  ON "Subscription"("recruiter_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripe_customer_id_key"
  ON "Subscription"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripe_subscription_id_key"
  ON "Subscription"("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripe_customer_id_idx"
  ON "Subscription"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "Subscription_trial_ends_at_idx"
  ON "Subscription"("trial_ends_at");

-- =========================================================================
-- 2. Tabela SubscriptionEvent (auditoria + idempotencia de webhooks)
-- =========================================================================
CREATE TABLE IF NOT EXISTS "SubscriptionEvent" (
  "id"              TEXT PRIMARY KEY,
  "subscription_id" TEXT NOT NULL,
  "event_type"      TEXT NOT NULL,
  "from_status"     TEXT,
  "to_status"       TEXT,
  "from_plan"       TEXT,
  "to_plan"         TEXT,
  "stripe_event_id" TEXT,
  "metadata"        JSONB,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SubscriptionEvent_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionEvent_stripe_event_id_key"
  ON "SubscriptionEvent"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "SubscriptionEvent_subscription_id_created_at_idx"
  ON "SubscriptionEvent"("subscription_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "SubscriptionEvent_event_type_idx"
  ON "SubscriptionEvent"("event_type");

-- =========================================================================
-- 3. Backfill: criar Subscription para cada Recruiter existente
-- =========================================================================
INSERT INTO "Subscription" (
  "id",
  "recruiter_id",
  "status",
  "plan",
  "trial_started_at",
  "trial_ends_at",
  "stripe_customer_id",
  "stripe_subscription_id",
  "current_period_end",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  r."id",
  COALESCE(r."subscription_status", 'trialing'),
  r."subscription_plan",
  COALESCE(r."created_at", NOW()),
  r."trial_ends_at",
  r."stripe_customer_id",
  r."stripe_subscription_id",
  r."subscription_current_period_end",
  COALESCE(r."created_at", NOW()),
  NOW()
FROM "Recruiter" r
WHERE NOT EXISTS (
  SELECT 1 FROM "Subscription" s WHERE s."recruiter_id" = r."id"
);

-- =========================================================================
-- 4. Evento inicial para cada subscription criada no backfill
-- =========================================================================
INSERT INTO "SubscriptionEvent" (
  "id",
  "subscription_id",
  "event_type",
  "to_status",
  "to_plan",
  "metadata",
  "created_at"
)
SELECT
  gen_random_uuid()::text,
  s."id",
  'backfilled',
  s."status",
  s."plan",
  jsonb_build_object('source', 'add_subscription_table.sql'),
  NOW()
FROM "Subscription" s
WHERE NOT EXISTS (
  SELECT 1 FROM "SubscriptionEvent" e
  WHERE e."subscription_id" = s."id" AND e."event_type" = 'backfilled'
);

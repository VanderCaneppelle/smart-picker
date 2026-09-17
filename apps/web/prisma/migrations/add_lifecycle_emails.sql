-- Registro dos e-mails de ciclo de vida já enviados (lembretes de fim de trial).
-- A UNIQUE é o que garante que a varredura não mande duas vezes.
-- Rodar no Supabase (SQL Editor) ou via prisma db execute.

CREATE TABLE IF NOT EXISTS lifecycle_emails (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recruiter_id TEXT NOT NULL,
  kind         TEXT NOT NULL,
  sent_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS lifecycle_emails_recruiter_kind_key
  ON lifecycle_emails (recruiter_id, kind);

CREATE INDEX IF NOT EXISTS lifecycle_emails_kind_sent_idx
  ON lifecycle_emails (kind, sent_at);

-- Migration: importação de currículos em lote (source, resume_sha256, needs_review)
-- Execute no Supabase: Dashboard → SQL Editor → New query → colar → Run.
-- Ou: pnpm --filter web exec prisma db execute --file prisma/migrations/add_candidate_import.sql --schema prisma/schema.prisma
-- NUNCA use "prisma db push" neste projeto: o banco é compartilhado.

ALTER TABLE "Candidate"
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS resume_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

-- Dedup e idempotência na mesma trava: o mesmo arquivo não entra duas vezes na mesma
-- vaga, e a reentrega de um webhook (fase do e-mail encaminhado) não cria candidato
-- repetido. Vários NULL não conflitam entre si no Postgres, então quem veio pelo
-- formulário (sem hash) não é afetado.
--
-- Parcial de propósito (WHERE deleted_at IS NULL): sem isso, um candidato excluído
-- deixaria o hash queimado para sempre e o recrutador nunca mais conseguiria
-- reimportar aquele arquivo, sem nenhuma explicação na tela. O Prisma não sabe
-- declarar índice parcial, então este índice vive só aqui no SQL.
CREATE UNIQUE INDEX IF NOT EXISTS "Candidate_job_id_resume_sha256_key"
  ON "Candidate" (job_id, resume_sha256)
  WHERE deleted_at IS NULL;

-- Serve à contagem do limite mensal de importações (source + janela de created_at).
CREATE INDEX IF NOT EXISTS "Candidate_source_created_at_idx"
  ON "Candidate" (source, created_at);

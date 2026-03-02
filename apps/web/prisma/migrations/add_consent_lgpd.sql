-- Migration: LGPD - Consentimento (consent_given_at, consent_version)
-- Execute no Supabase: Dashboard → SQL Editor → New query → colar → Run.
-- Isso adiciona as colunas sem precisar de "prisma migrate reset" (sem perder dados).

-- Opção 1: tabela "Candidate" (nome exato do model Prisma)
ALTER TABLE "Candidate"
  ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

-- Se der erro "relation Candidate does not exist", use a Opção 2 (descomente as linhas abaixo):
-- ALTER TABLE candidate
--   ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP(3),
--   ADD COLUMN IF NOT EXISTS consent_version TEXT;

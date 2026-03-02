-- Migration: Notas e transcrição da entrevista (recruiter_notes)
-- Execute no Supabase: Dashboard → SQL Editor → New query → colar → Run.

ALTER TABLE "Candidate"
  ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

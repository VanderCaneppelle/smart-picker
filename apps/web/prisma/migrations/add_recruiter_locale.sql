-- Idioma do recrutador. Usado pela interface, pelos e-mails e pelo prompt da IA.
-- Rodar no Supabase (SQL Editor) ou via prisma db execute.

ALTER TABLE "Recruiter"
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'pt';

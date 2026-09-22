-- Equipe: vários usuários dentro de uma mesma assinatura.
-- Rodar no Supabase (SQL Editor) ou via prisma db execute.
--
-- Aditiva de propósito: account_owner_id nulo significa "esta linha é a conta".
-- Todo recrutador que já existe continua dono, sem backfill e sem downtime.

ALTER TABLE "Recruiter"
  ADD COLUMN IF NOT EXISTS account_owner_id TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_email_sent_at TIMESTAMP(3);

-- Apagar o dono apaga os membros junto. Sem isso sobraria membro órfão apontando
-- para uma conta que não existe mais, e ele continuaria conseguindo logar.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Recruiter_account_owner_id_fkey'
  ) THEN
    ALTER TABLE "Recruiter"
      ADD CONSTRAINT "Recruiter_account_owner_id_fkey"
      FOREIGN KEY (account_owner_id) REFERENCES "Recruiter"(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Recruiter_account_owner_id_idx"
  ON "Recruiter"(account_owner_id);

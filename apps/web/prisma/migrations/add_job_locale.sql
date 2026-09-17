-- Idioma da vaga. Define a língua da página de candidatura e dos e-mails ao candidato.
-- Herda do recrutador na criação e não muda depois.

ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'pt';

-- Vagas que já existem ficam com o idioma do dono, e não com o padrão cego.
UPDATE "Job" j
   SET locale = r.locale
  FROM "Recruiter" r
 WHERE j.user_id = r.id
   AND j.locale = 'pt'
   AND r.locale <> 'pt';

-- Avisos do admin exibidos no portal do recrutador.
-- Rodar no Supabase (SQL Editor) ou via psql. Não roda sozinho.

CREATE TABLE IF NOT EXISTS announcements (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  level       TEXT NOT NULL DEFAULT 'info',
  active      BOOLEAN NOT NULL DEFAULT true,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  starts_at   TIMESTAMP(3),
  ends_at     TIMESTAMP(3),
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A consulta do portal é sempre "ativos dentro da janela", então o índice cobre os três.
CREATE INDEX IF NOT EXISTS announcements_active_window_idx
  ON announcements (active, starts_at, ends_at);

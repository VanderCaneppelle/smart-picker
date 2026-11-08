-- Supabase Setup Script
-- Run this in the Supabase SQL Editor after creating your project

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for resumes
-- Público só para servir o arquivo pelo link direto (o nome é um UUID). Listar a
-- bucket e subir arquivo NÃO são públicos: ver as políticas abaixo.
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Não crie política de SELECT nem de INSERT para anon/public nesta bucket.
--
-- Uma política "SELECT USING (bucket_id = 'resumes')" deixa qualquer pessoa com a
-- anon key (que vai no bundle do site) LISTAR todos os currículos pela API de
-- storage. E um "INSERT WITH CHECK (bucket_id = 'resumes')" sem papel deixa qualquer
-- pessoa subir arquivo direto, sem passar pelas validações de /api/upload.
-- As duas existiam aqui e foram removidas de produção em 2026-11-08.
--
-- Nada no app precisa delas: upload e getPublicUrl rodam com a service role
-- (supabaseAdmin), e o download pelo link público de uma bucket pública não passa
-- por RLS.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;

-- Allow service role to manage all objects
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL
  USING (auth.role() = 'service_role');

-- Note: The database tables (Job, Candidate) will be created by Prisma migrations
-- Run: pnpm db:push or pnpm db:migrate from the apps/web directory

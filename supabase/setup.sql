-- Supabase Setup Script
-- Run this in the Supabase SQL Editor after creating your project

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to resumes bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resumes');

-- Allow authenticated users to upload to resumes bucket
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'resumes');

-- Allow service role to manage all objects
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL
  USING (auth.role() = 'service_role');

-- Note: The database tables (Job, Candidate) will be created by Prisma migrations
-- Run: pnpm db:push or pnpm db:migrate from the apps/web directory

import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SLUG_NO_CONSECUTIVE_HYPHENS = /--/;

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'auth', 'dashboard', 'help', 'login', 'logout',
  'settings', 'signup', 'support', 'www', 'jobs', 'candidates', 'onboarding',
  'perfil', 'r', 'recruiter', 'rankea', 'about', 'pricing', 'blog',
]);

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) return { valid: false, error: 'Slug é obrigatório' };
  if (slug.length < 3) return { valid: false, error: 'Mínimo de 3 caracteres' };
  if (slug.length > 40) return { valid: false, error: 'Máximo de 40 caracteres' };
  if (SLUG_NO_CONSECUTIVE_HYPHENS.test(slug)) return { valid: false, error: 'Não pode conter hífens consecutivos' };
  if (!SLUG_REGEX.test(slug)) return { valid: false, error: 'Use apenas letras minúsculas, números e hífens' };
  if (RESERVED_SLUGS.has(slug)) return { valid: false, error: 'Este slug é reservado' };
  return { valid: true };
}

export const slugSchema = z
  .string()
  .min(3, 'Mínimo de 3 caracteres')
  .max(40, 'Máximo de 40 caracteres')
  .regex(SLUG_REGEX, 'Use apenas letras minúsculas, números e hífens (sem iniciar/terminar com hífen)')
  .refine((s) => !SLUG_NO_CONSECUTIVE_HYPHENS.test(s), 'Não pode conter hífens consecutivos')
  .refine((s) => !RESERVED_SLUGS.has(s), 'Este slug é reservado');

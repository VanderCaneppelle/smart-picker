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

/**
 * Devolve CHAVE de tradução, não texto.
 *
 * Esta função roda nos dois lados: no formulário de perfil, no passo de
 * onboarding e na rota que checa disponibilidade. Texto fixo aqui saía em
 * português para todo mundo. Quem chama resolve com t().
 */
export function validateSlug(slug: string): { valid: boolean; errorKey?: string } {
  if (!slug) return { valid: false, errorKey: 'slug.obrigatorio' };
  if (slug.length < 3) return { valid: false, errorKey: 'slug.minimo' };
  if (slug.length > 40) return { valid: false, errorKey: 'slug.maximo' };
  if (SLUG_NO_CONSECUTIVE_HYPHENS.test(slug)) return { valid: false, errorKey: 'slug.hifens' };
  if (!SLUG_REGEX.test(slug)) return { valid: false, errorKey: 'slug.formato' };
  if (RESERVED_SLUGS.has(slug)) return { valid: false, errorKey: 'slug.reservado' };
  return { valid: true };
}

export const slugSchema = z
  .string()
  .min(3, 'slug.minimo')
  .max(40, 'slug.maximo')
  .regex(SLUG_REGEX, 'slug.formatoLongo')
  .refine((s) => !SLUG_NO_CONSECUTIVE_HYPHENS.test(s), 'slug.hifens')
  .refine((s) => !RESERVED_SLUGS.has(s), 'slug.reservado');

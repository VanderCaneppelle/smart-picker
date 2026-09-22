import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Antes disto, /robots.txt respondia 404.
 *
 * O painel, as APIs e a área de admin ficam fora do índice: são páginas atrás de
 * sessão, que só gastariam rastreamento e ainda poderiam expor caminho interno em
 * busca. O que interessa indexar é a landing, os preços e, principalmente, as páginas
 * públicas de vaga, que são o conteúdo que traz gente de fora.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // O painel e a página pública de candidatura moram na mesma raiz /jobs: o
        // recrutador edita em /jobs/<id> e o candidato se inscreve em /jobs/<id>/apply.
        // Por isso o allow específico vem junto do disallow da raiz; regra mais longa
        // vence, então a página de candidatura continua indexável e o painel não.
        allow: ['/', '/jobs/*/apply'],
        disallow: [
          '/api/',
          '/admin',
          '/dashboard',
          '/jobs',
          '/candidates',
          '/candidatos-salvos',
          '/perfil',
          '/equipe',
          '/settings',
          '/onboarding',
          '/trocar-senha',
          '/reset-password',
          '/forgot-password',
          '/spike',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/site';

/**
 * Antes disto, /sitemap.xml respondia 404.
 *
 * Revalida de hora em hora: vaga nova precisa entrar no índice rápido, e uma consulta
 * por hora não pesa em nada. Sem isso o arquivo congelaria no momento do build.
 */
export const revalidate = 3600;

/** Páginas de conteúdo, nas duas línguas. O painel não entra: é área com sessão. */
const ESTATICAS: Array<{ caminho: string; prioridade: number; frequencia: 'daily' | 'weekly' | 'monthly' }> = [
  { caminho: '', prioridade: 1, frequencia: 'weekly' },
  { caminho: '/pricing', prioridade: 0.8, frequencia: 'weekly' },
  { caminho: '/termos', prioridade: 0.3, frequencia: 'monthly' },
  { caminho: '/privacidade', prioridade: 0.3, frequencia: 'monthly' },
  { caminho: '/solicitar-exclusao', prioridade: 0.3, frequencia: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();

  const paginas: MetadataRoute.Sitemap = [];

  for (const { caminho, prioridade, frequencia } of ESTATICAS) {
    // pt fica na raiz e en no prefixo; declarar as duas como alternativas evita que o
    // Google trate a versão em inglês como conteúdo duplicado da portuguesa.
    paginas.push({
      url: `${SITE_URL}${caminho || '/'}`,
      lastModified: agora,
      changeFrequency: frequencia,
      priority: prioridade,
      alternates: {
        languages: {
          pt: `${SITE_URL}/pt${caminho}`,
          en: `${SITE_URL}/en${caminho}`,
        },
      },
    });
  }

  // Consultas em série, nunca Promise.all: pgbouncer com connection_limit=1.
  const vagas = await prisma.job.findMany({
    where: { status: 'active', deleted_at: null },
    select: { id: true, updated_at: true },
    orderBy: { updated_at: 'desc' },
    take: 1000,
  });

  const perfis = await prisma.recruiter.findMany({
    where: { public_page_enabled: true, public_slug: { not: null } },
    select: { public_slug: true, updated_at: true },
    take: 1000,
  });

  for (const vaga of vagas) {
    paginas.push({
      url: `${SITE_URL}/jobs/${vaga.id}/apply`,
      lastModified: vaga.updated_at,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  for (const perfil of perfis) {
    paginas.push({
      url: `${SITE_URL}/r/${perfil.public_slug}`,
      lastModified: perfil.updated_at,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return paginas;
}

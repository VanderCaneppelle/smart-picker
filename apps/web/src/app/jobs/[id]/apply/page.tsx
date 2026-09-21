import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/site';
import ApplyForm from './ApplyForm';

/**
 * Casca de servidor da página pública de candidatura.
 *
 * O formulário continua sendo client component, intocado: ele é o caminho de
 * conversão do candidato e não vale o risco de reescrever. O que esta casca
 * acrescenta é o que só o servidor consegue entregar, e que faltava por inteiro:
 *
 * 1. `generateMetadata`, para o link da vaga compartilhado no WhatsApp ou no LinkedIn
 *    mostrar o título da vaga em vez do nome genérico do produto;
 * 2. JSON-LD `JobPosting`, que é o que faz a vaga poder aparecer no Google for Jobs.
 *    Sem ele, a página é só mais uma página, e a busca por emprego é justamente onde
 *    existe gente procurando de graça.
 *
 * A consulta é feita aqui no servidor e o formulário segue buscando a dele pela API.
 * São duas leituras da mesma vaga, o que é pouco elegante e muito seguro: mexer no
 * estado do formulário para economizar uma consulta arriscaria a conversão.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

async function buscarVaga(id: string) {
  // Um uuid inválido faz o Postgres devolver erro em vez de vazio, e aí a página
  // pública quebraria por causa de um link torto.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  return prisma.job.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      employment_type: true,
      status: true,
      created_at: true,
      updated_at: true,
      locale: true,
      recruiter: {
        select: { company: true, public_display_name: true, public_slug: true },
      },
    },
  });
}

/** Tira o HTML do editor e corta no tamanho que os previews realmente mostram. */
function resumoDaDescricao(html: string, limite = 200): string {
  const texto = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vaga = await buscarVaga(id);

  if (!vaga) {
    return { title: 'Vaga não encontrada', robots: { index: false, follow: false } };
  }

  const empresa =
    vaga.recruiter?.public_display_name || vaga.recruiter?.company || 'Rankea';
  const titulo = `${vaga.title} | ${empresa}`;
  const descricao = resumoDaDescricao(vaga.description);
  const url = `${SITE_URL}/jobs/${vaga.id}/apply`;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: url },
    // Vaga fechada ou em rascunho sai do índice: candidato que chega pelo Google numa
    // vaga que não aceita mais inscrição é pior do que não chegar.
    robots:
      vaga.status === 'active'
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      type: 'website',
      url,
      title: titulo,
      description: descricao,
      siteName: 'Rankea',
      locale: vaga.locale === 'en' ? 'en_US' : 'pt_BR',
    },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao },
  };
}

/**
 * Tipos de contrato do schema.org. O Google só entende esta lista; mandar o valor
 * interno faria o dado ser descartado em silêncio.
 */
const TIPO_SCHEMA: Record<string, string> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
  freelance: 'CONTRACTOR',
};

function montarJsonLd(vaga: NonNullable<Awaited<ReturnType<typeof buscarVaga>>>) {
  const empresa =
    vaga.recruiter?.public_display_name || vaga.recruiter?.company || 'Rankea';
  const remota = /remot|home ?office|anywhere/i.test(vaga.location);

  return {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: vaga.title,
    description: vaga.description,
    datePosted: vaga.created_at.toISOString(),
    employmentType: TIPO_SCHEMA[vaga.employment_type] ?? 'OTHER',
    directApply: true,
    hiringOrganization: {
      '@type': 'Organization',
      name: empresa,
      ...(vaga.recruiter?.public_slug
        ? { sameAs: `${SITE_URL}/r/${vaga.recruiter.public_slug}` }
        : {}),
    },
    // Trabalho remoto tem marcação própria: declarar um endereço inventado para uma
    // vaga remota é o erro que faz o Google rejeitar o anúncio.
    ...(remota
      ? {
          jobLocationType: 'TELECOMMUTE',
          applicantLocationRequirements: { '@type': 'Country', name: 'BR' },
        }
      : {
          jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: vaga.location, addressCountry: 'BR' },
          },
        }),
  };
}

export default async function ApplyPage({ params }: PageProps) {
  const { id } = await params;
  const vaga = await buscarVaga(id);

  return (
    <>
      {/* Só vaga aberta vira dado estruturado: anunciar no Google uma vaga que não
          aceita inscrição gera reclamação de candidato e penalidade de rich result. */}
      {vaga?.status === 'active' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(montarJsonLd(vaga)) }}
        />
      )}
      <ApplyForm />
    </>
  );
}

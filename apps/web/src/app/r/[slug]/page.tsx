import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Briefcase, Globe, Mail, Linkedin } from 'lucide-react';
import { ShareSection } from './ShareSection';
import { JobListWithFilters } from './JobListWithFilters';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRecruiterBySlug(slug: string) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { public_slug: slug },
    select: {
      id: true,
      name: true,
      company: true,
      email: true,
      public_slug: true,
      public_page_enabled: true,
      public_display_name: true,
      public_headline: true,
      public_logo_url: true,
      public_linkedin_url: true,
      brand_color: true,
      reply_to_email: true,
    },
  });

  if (!recruiter || !recruiter.public_page_enabled) return null;

  const jobs = await prisma.job.findMany({
    where: {
      user_id: recruiter.id,
      status: 'active',
      deleted_at: null,
    },
    select: {
      id: true,
      title: true,
      location: true,
      employment_type: true,
      salary_range: true,
      currency_code: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return { recruiter, jobs };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRecruiterBySlug(slug);

  if (!data) {
    return { title: 'Página não encontrada | Rankea' };
  }

  const { recruiter } = data;
  const displayName =
    recruiter.public_display_name || recruiter.company || recruiter.name;

  return {
    title: `${displayName} — Vagas abertas | Rankea`,
    description:
      recruiter.public_headline ||
      `Confira as vagas abertas de ${displayName} no Rankea.`,
  };
}

export default async function RecruiterPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getRecruiterBySlug(slug);

  if (!data) notFound();

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const pageUrl = `${protocol}://${host}/r/${slug}`;

  const { recruiter, jobs } = data;
  const displayName =
    recruiter.public_display_name || recruiter.company || recruiter.name;
  const brandColor = recruiter.brand_color || '#2563eb';
  const contactEmail = recruiter.reply_to_email || recruiter.email;

  const linkedinUrl = recruiter.public_linkedin_url?.trim();

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header: logo + nome + LinkedIn + contato */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex justify-center mb-3">
              {recruiter.public_logo_url ? (
                <img
                  src={recruiter.public_logo_url}
                  alt={displayName}
                  className="h-12 w-12 object-contain rounded-xl"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}18` }}
                >
                  <Globe className="h-6 w-6" style={{ color: brandColor }} />
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            {recruiter.public_headline && (
              <p className="mt-1 text-sm text-gray-500 max-w-md">{recruiter.public_headline}</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-3">
              {linkedinUrl && (
                <a
                  href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-[#0a66c2] hover:bg-[#0a66c2]/5 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Entrar em contato
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lista de vagas com filtros */}
        <section id="vagas" className="pb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {jobs.length > 0
              ? `Vagas abertas (${jobs.length})`
              : 'Nenhuma vaga aberta no momento'}
          </h2>

          {jobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Não há vagas abertas no momento. Volte em breve!
              </p>
            </div>
          )}

          {jobs.length > 0 && (
            <JobListWithFilters jobs={jobs} brandColor={brandColor} />
          )}
        </section>

        {/* Bloco: Não encontrou a vaga? */}
        {contactEmail && (
          <section className="pb-12">
            <div
              className="rounded-2xl p-8 sm:p-10 text-center text-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              <h2 className="text-xl font-bold mb-3">
                Não encontrou a vaga ideal?
              </h2>
              <p className="max-w-xl mx-auto text-white/90 mb-4 text-sm sm:text-base">
                Estamos sempre em busca de bons talentos. Envie seu currículo e
                conte como você pode contribuir.
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-block font-medium underline underline-offset-2 hover:no-underline"
              >
                {contactEmail}
              </a>
            </div>
          </section>
        )}

        {/* Compartilhar */}
        {jobs.length > 0 && (
          <ShareSection
            pageUrl={pageUrl}
            title={`Vagas abertas - ${displayName}`}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} {displayName}. Todos os direitos reservados.</span>
          <Link href="/" className="text-gray-500 hover:text-gray-700 font-medium">
            Powered by Rankea
          </Link>
        </div>
      </footer>
    </div>
  );
}

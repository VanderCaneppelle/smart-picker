import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Título e descrição por idioma. Sem isto a página em inglês aparece no Google com
 * o título em português, que é justamente o que o visitante estrangeiro lê antes
 * de decidir se clica.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('titulo'),
    description: t('descricao'),
    openGraph: {
      title: t('titulo'),
      description: t('ogDescricao'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
    },
    alternates: {
      canonical: locale === 'pt' ? '/' : `/${locale}`,
      languages: { 'pt-BR': '/', en: '/en' },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();

  // Permite renderização estática das páginas traduzidas.
  setRequestLocale(locale);

  /**
   * O provider vive AQUI, e não no layout raiz, de propósito.
   *
   * Em navegação suave o Next re-renderiza só os segmentos que mudaram. O layout raiz
   * é compartilhado entre /pt e /en, então um provider lá dentro mantinha o idioma
   * antigo: a URL virava /en e o texto continuava em português. Aqui, como o segmento
   * [locale] faz parte da rota, ele re-renderiza junto e o idioma acompanha.
   */
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

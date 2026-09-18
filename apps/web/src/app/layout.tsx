import type { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { moedaDaRequisicao } from '@/lib/pais';
import { MoedaProvider } from '@/contexts/MoedaContext';
import './globals.css';

/**
 * Metadados do layout raiz. generateMetadata em vez de constante: o título e a
 * descrição precisam do idioma, e ele só existe por requisição. A constante era
 * avaliada na importação e saía sempre em português, inclusive em /en.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  const locale = await getLocale();
  return {
    title: t('titulo'),
    description: t('descricao'),
    keywords: t('palavrasChave').split(','),
    icons: { icon: '/favicon.png', apple: '/favicon.png' },
    openGraph: {
      title: t('titulo'),
      description: t('ogDescricao'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
    },
  };
}

/**
 * O layout raiz atende tanto as rotas dentro de [locale] quanto as de fora (painel,
 * candidatura, admin). getLocale resolve pela URL quando ela traz o idioma e pelo
 * cookie no resto, então tudo sai renderizado na língua certa já na primeira pintura.
 *
 * As rotas dentro de [locale] recebem um segundo provider, mais interno, que existe
 * para re-renderizar na troca de idioma. O de dentro vence, como deve ser.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  // O país vive na requisição, que só o servidor enxerga. Desce por contexto.
  const moeda = await moedaDaRequisicao();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vjlqalerjb");
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-gray-50 antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MoedaProvider moeda={moeda}>
          <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
          </MoedaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { moedaDaRequisicao } from '@/lib/pais';
import { SITE_URL } from '@/lib/site';
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
    // Sem isto, as URLs de og:image saem com o host da requisição. Em preview da
    // Vercel ou atrás de proxy, o cartão compartilhado apontaria para um domínio que
    // não é o do site.
    metadataBase: new URL(SITE_URL),
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
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/*
          GA4 só carrega se o ID existir. Assim o repositório não depende de conta
          criada para rodar, e ligar a medição é setar uma variável na Vercel, sem
          deploy de código. Sem o ID, registrarEvento simplesmente não encontra o
          gtag e segue em frente.
        */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
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

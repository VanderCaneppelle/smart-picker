import type { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rankea | Seleção simples, decisão inteligente',
  description: 'Reduza o tempo de triagem e aumente a precisão da sua seleção com ranking automatizado por IA. Feito para consultores de RH.',
  keywords: ['recrutamento', 'seleção', 'RH', 'IA', 'ranking', 'candidatos', 'triagem'],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Rankea | Seleção simples, decisão inteligente',
    description: 'Ranking automatizado de candidatos por IA. Feito para consultores de RH independentes.',
    type: 'website',
    locale: 'pt_BR',
  },
};

/**
 * O layout raiz atende tanto as rotas traduzidas (dentro de [locale]) quanto as que
 * ainda não foram traduzidas. getLocale devolve o idioma da URL quando existe, e o
 * padrão nos demais casos, então o atributo lang fica correto nos dois mundos.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

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
          <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rankea — Seleção simples, decisão inteligente',
  description: 'Reduza o tempo de triagem e aumente a precisão da sua seleção com ranking automatizado por IA. Feito para consultores de RH.',
  keywords: ['recrutamento', 'seleção', 'RH', 'IA', 'ranking', 'candidatos', 'triagem'],
  openGraph: {
    title: 'Rankea — Seleção simples, decisão inteligente',
    description: 'Ranking automatizado de candidatos por IA. Feito para consultores de RH independentes.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
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
      <body className="min-h-screen bg-gray-50 antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}

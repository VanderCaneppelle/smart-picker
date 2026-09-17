'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import pt from '../../messages/pt.json';
import en from '../../messages/en.json';

const DICIONARIOS = { pt, en } as const;
type Idioma = keyof typeof DICIONARIOS;

/**
 * Idioma da área logada. Aqui ele NÃO vem da URL como no site público: vem da
 * preferência que o recrutador salvou no banco, a mesma que o worker usa para montar
 * e-mail e prompt. Assim a pessoa vê a mesma língua em todo lugar, inclusive no
 * e-mail que chega depois, sem depender de qual aba do navegador ela abriu.
 */
export function AppIntlProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [locale, setLocale] = useState<Idioma>('pt');

  useEffect(() => {
    if (isLoading) return;
    apiClient
      .getRecruiterProfile()
      .then((p) => {
        const l = (p as { locale?: string }).locale;
        if (l === 'en' || l === 'pt') setLocale(l);
      })
      .catch(() => {
        // Sem preferência acessível, segue no padrão. Idioma errado é ruim; tela em
        // branco por causa do idioma é pior.
      });
  }, [isLoading]);

  return (
    <NextIntlClientProvider locale={locale} messages={DICIONARIOS[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}

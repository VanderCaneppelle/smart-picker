'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing, type Locale } from '@/i18n/routing';

const ROTULO: Record<Locale, string> = { pt: 'PT', en: 'EN' };

/** Um ano. É preferência, não sessão. */
const UM_ANO = 60 * 60 * 24 * 365;

/**
 * Troca o idioma mantendo a página atual.
 *
 * Além de navegar, grava o cookie que o servidor lê. Sem isso a escolha valeria só
 * dentro de /en: ao entrar no painel, na página de candidatura ou em qualquer rota
 * fora de [locale], o servidor voltaria a renderizar no padrão.
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const trocar = (novo: Locale) => {
    if (novo === locale) return;
    document.cookie = `NEXT_LOCALE=${novo}; path=/; max-age=${UM_ANO}; samesite=lax`;
    router.replace(pathname, { locale: novo });
  };

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-gray-200">
      {routing.locales.map((l, i) => (
        <button
          key={l}
          type="button"
          onClick={() => trocar(l)}
          aria-current={l === locale ? 'true' : undefined}
          className={`px-2 py-1 text-[12px] font-semibold transition-colors ${
            l === locale ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-900'
          } ${i > 0 ? 'border-l border-gray-200' : ''}`}
        >
          {ROTULO[l]}
        </button>
      ))}
    </div>
  );
}

'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { routing, type Locale } from '@/i18n/routing';

const ROTULO: Record<Locale, string> = { pt: 'PT', en: 'EN' };

/**
 * Troca o idioma mantendo a página atual. Usa o router do next-intl, que resolve o
 * prefixo sozinho: o português fica sem prefixo e o inglês ganha /en.
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-gray-200">
      {routing.locales.map((l, i) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
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

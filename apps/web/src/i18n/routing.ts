import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'pt',
  // 'as-needed': o português fica em / e /pricing, sem prefixo, então nenhuma URL
  // existente quebra e o SEO em português que já existe é preservado. O inglês
  // ganha /en e /en/pricing, que é o que o Google indexa separado.
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

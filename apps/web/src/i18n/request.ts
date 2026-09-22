import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { ehLocale, negociarLocale } from './negociar';

/** Cookie lido pelo servidor. É o que permite renderizar já no idioma certo. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Ordem de resolução, e ela importa:
 *
 * 1. O segmento da URL, quando existe (/en/...). É explícito e indexável.
 * 2. O cookie, para tudo que vive fora de [locale]: painel, página de candidatura,
 *    telas de conta. Sem ele o servidor renderizaria em português e o navegador
 *    trocaria depois, que é o piscar que a gente tinha.
 * 3. O Accept-Language do navegador, a lista inteira, respeitando os q=.
 *    Sem português na lista, cai em inglês: ver negociarLocale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const daUrl = await requestLocale;
  if (ehLocale(daUrl)) {
    return { locale: daUrl, messages: (await import(`../../messages/${daUrl}.json`)).default };
  }

  const doCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (ehLocale(doCookie)) {
    return { locale: doCookie, messages: (await import(`../../messages/${doCookie}.json`)).default };
  }

  const locale = negociarLocale((await headers()).get('accept-language'));

  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});

/**
 * URL canônica do site, usada em sitemap, robots, og:image e JSON-LD.
 *
 * Não confia cegamente em NEXT_PUBLIC_APP_URL: no .env local ela vale
 * http://localhost:3000, e um deploy que herde esse valor publicaria um sitemap
 * apontando para localhost, o que o Google trata como site quebrado. Só aceita
 * origem https; qualquer outra coisa cai no domínio de produção.
 */
const CANONICA = 'https://www.rankea.ai';

export const SITE_URL = (() => {
  const doAmbiente = process.env.NEXT_PUBLIC_APP_URL;
  if (doAmbiente?.startsWith('https://')) return doAmbiente.replace(/\/$/, '');
  return CANONICA;
})();

export function urlAbsoluta(caminho: string): string {
  return `${SITE_URL}${caminho.startsWith('/') ? caminho : `/${caminho}`}`;
}

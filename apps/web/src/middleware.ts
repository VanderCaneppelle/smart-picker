import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

/**
 * Matcher deliberadamente estreito. Só as páginas que foram traduzidas passam pelo
 * middleware de idioma. O painel, as APIs, a página pública de vagas e o admin ficam
 * fora, então nada do que já funciona muda de caminho.
 *
 * Ao traduzir uma área nova, acrescente a rota aqui e mova a pasta para [locale].
 */
export const config = {
  matcher: ['/', '/pricing', '/login', '/signup', '/(en|pt)/:path*'],
};

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { ehLocale, negociarLocale } from './i18n/negociar';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const handleI18n = createMiddleware(routing);

/**
 * O next-intl manda para o defaultLocale (pt) todo idioma que ele não reconhece,
 * então espanhol, alemão e francês caíam em português. Aqui a decisão é nossa
 * antes de delegar: sem português no Accept-Language, o visitante vai para /en.
 *
 * Só vale quando não há escolha explícita. Prefixo na URL ou cookie já significam
 * que alguém decidiu, e aí não mexemos.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const temPrefixo = /^\/(en|pt)(\/|$)/.test(pathname);
  const doCookie = request.cookies.get(LOCALE_COOKIE)?.value;

  if (!temPrefixo && !ehLocale(doCookie)) {
    if (negociarLocale(request.headers.get('accept-language')) === 'en') {
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return handleI18n(request);
}

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

import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Cabeçalhos de segurança em todas as respostas.
 *
 * O CSP é mínimo de propósito: só trava quem pode emoldurar o site, a <base> e
 * plugins. Uma lista de origens de script (GA, Turnstile, Stripe, Supabase) quebraria
 * o site em silêncio a cada integração nova, e o ganho não compensa por enquanto.
 * Nada do Rankea é feito para rodar dentro de iframe de terceiros; a única iframe
 * do app é a pré-visualização de e-mail, que é da própria página.
 */
const securityHeaders = [
  // Impede que outro site abra o Rankea num iframe e engane o clique (clickjacking).
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  // O navegador não tenta adivinhar o tipo do arquivo: um upload não vira script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Link para fora leva só o domínio, nunca o caminho (que pode ter id de vaga ou token).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  transpilePackages: ['@hunter/core'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);

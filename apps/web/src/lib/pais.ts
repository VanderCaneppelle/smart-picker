import { headers } from 'next/headers';

export type Moeda = 'BRL' | 'USD';

/**
 * País de quem está acessando, pelo header que a Vercel injeta em toda requisição.
 * Não custa nada e não precisa de serviço externo. Fora da Vercel (dev, testes)
 * o header não existe e devolvemos null.
 */
export async function paisDaRequisicao(): Promise<string | null> {
  const h = await headers();
  return h.get('x-vercel-ip-country')?.toUpperCase() ?? null;
}

/**
 * Moeda pelo PAÍS, não pelo idioma.
 *
 * Quem cobra é o Stripe, e ele decide pelo país do cartão. Usar o idioma como
 * proxy mostrava US$ para um brasileiro que trocasse o site para inglês, e ele
 * seria cobrado em real. País é o mesmo sinal que o Stripe usa.
 *
 * Sem header (dev, ou um proxy que o removeu) caímos em BRL, que é a moeda base
 * dos preços: na dúvida mostramos o valor que sai sem conversão nenhuma.
 */
export async function moedaDaRequisicao(): Promise<Moeda> {
  const pais = await paisDaRequisicao();
  if (!pais) return 'BRL';
  return pais === 'BR' ? 'BRL' : 'USD';
}

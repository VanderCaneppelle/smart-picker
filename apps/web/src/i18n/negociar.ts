import { routing, type Locale } from './routing';

export function ehLocale(v: string | undefined | null): v is Locale {
  return !!v && routing.locales.includes(v as Locale);
}

/**
 * Escolhe o idioma a partir do Accept-Language.
 *
 * O header vem como "es-ES,es;q=0.9,en;q=0.8": uma lista ordenada por preferência.
 * Ler só o primeiro item, como fazíamos, descartava o resto: o espanhol acima diz
 * que lê inglês, e mesmo assim caía no padrão.
 *
 * Com header e sem português na lista, cai em 'en': quem não pede português tem
 * mais chance de ler inglês, e é o que o resto do mundo espera de um site que não
 * fala a língua dele.
 *
 * SEM header é outra coisa: é ausência de sinal, não preferência por inglês. Esse
 * é o caso dos robôs de busca, e mandá-los para /en apagaria o SEO em português
 * que hoje vive em /. Aí fica o padrão.
 */
export function negociarLocale(aceita: string | null | undefined): Locale {
  if (!aceita?.trim()) return routing.defaultLocale;

  const candidatos = aceita
    .split(',')
    .map((parte) => {
      const [tag, ...params] = parte.trim().split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='));
      const peso = q ? Number.parseFloat(q.slice(2)) : 1;
      return { base: tag.trim().split('-')[0].toLowerCase(), peso: Number.isNaN(peso) ? 0 : peso };
    })
    .filter((c) => c.peso > 0)
    .sort((a, b) => b.peso - a.peso);

  for (const { base } of candidatos) {
    if (ehLocale(base)) return base;
  }
  return 'en';
}

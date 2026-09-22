import { getTranslations } from 'next-intl/server';

/**
 * Tradutor para rotas de API.
 *
 * O idioma vem do mesmo lugar que nas páginas: o cookie NEXT_LOCALE, com o
 * Accept-Language como reserva. Mensagem de erro do servidor aparece em toast
 * na tela do usuário, então texto fixo em português vazava para quem lê inglês.
 *
 * Uso: const t = await tradutorDeErros(); ... { message: t('erros.uploadTipo') }
 */
export async function tradutorDeErros() {
  return getTranslations();
}

/**
 * Traduz a mensagem de um erro do Zod quando ela é uma chave.
 *
 * Os schemas guardam chave em vez de texto, porque são constantes de módulo:
 * avaliadas na importação, antes de existir requisição e idioma.
 */
export function traduzirChave(t: Awaited<ReturnType<typeof getTranslations>>, valor: string): string {
  return /^[a-z][a-zA-Z0-9]*\.[a-zA-Z0-9.]+$/.test(valor) ? t(valor) : valor;
}

/**
 * Traduz as mensagens de um erro do Zod.
 *
 * Os schemas são constantes de módulo, avaliadas na importação, antes de existir
 * requisição. Por isso guardam chave e a tradução acontece aqui, na resposta.
 */
export function traduzirZod(
  t: Awaited<ReturnType<typeof getTranslations>>,
  flat: { formErrors: string[]; fieldErrors: Record<string, string[] | undefined> }
) {
  const traduz = (m: string) => traduzirChave(t, m);
  return {
    formErrors: flat.formErrors.map(traduz),
    fieldErrors: Object.fromEntries(
      Object.entries(flat.fieldErrors).map(([campo, msgs]) => [campo, msgs?.map(traduz)])
    ),
  };
}

/**
 * Onde os currículos importados são gravados dentro do bucket `resumes`.
 *
 * O prefixo por conta é a prova de propriedade do arquivo. A rota de importação recebe
 * o storage_path do cliente, e sem esse prefixo qualquer conta poderia importar para a
 * própria vaga o arquivo que outra conta subiu, bastando adivinhar o caminho. Com ele,
 * a checagem é uma comparação de string: quem não subiu, não importa.
 *
 * Vive num arquivo próprio porque as duas pontas precisam concordar: a rota de upload
 * escreve, a rota de importação confere.
 */
export function importPathPrefix(accountId: string): string {
  return `imports/${accountId}/`;
}

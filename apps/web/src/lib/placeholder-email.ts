/**
 * Domínio dos e-mails provisórios criados pela importação de currículos. Não existe de
 * propósito: nada enviado para ele pode ser entregue.
 *
 * Mandar mensagem para um endereço desses não é só inútil, é prejudicial. Cada tentativa
 * volta como hard bounce, e bounce em volume derruba a reputação do domínio de envio,
 * atrapalhando os e-mails que precisam chegar, dos candidatos que de fato se
 * candidataram.
 */
export const PLACEHOLDER_EMAIL_DOMAIN = '@import.rankea.ai';

/** True quando o candidato ainda está com o e-mail provisório da importação. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}

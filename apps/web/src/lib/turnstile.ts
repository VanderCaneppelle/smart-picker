/**
 * Verificação do Turnstile (captcha da Cloudflare) no cadastro.
 *
 * Motivo: das 282 contas em produção, 275 são de robô. Nomes como `wPVMkoCaNKptcQiE`,
 * domínios descartáveis, 86 cadastros num mês sem uma vaga publicada. Isso não é só
 * lixo no banco: contamina toda métrica de funil, e a partir de agora existe funil
 * para contaminar.
 *
 * Fica opcional de propósito. Sem `TURNSTILE_SECRET_KEY` configurada, o cadastro
 * funciona exatamente como antes. Assim o código pode subir hoje e ser ligado quando
 * as chaves existirem, sem um deploy no meio do caminho e sem travar quem estiver
 * tentando criar conta nesse intervalo.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileAtivo(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export interface ResultadoTurnstile {
  ok: boolean;
  motivo?: string;
}

export async function verificarTurnstile(
  token: string | null | undefined,
  ip?: string | null
): Promise<ResultadoTurnstile> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (!token) return { ok: false, motivo: 'missing_token' };

  const corpo = new URLSearchParams({ secret, response: token });
  if (ip) corpo.set('remoteip', ip);

  try {
    // Timeout curto: se a Cloudflare estiver lenta, é melhor deixar o cadastro passar
    // do que bloquear gente de verdade na porta. O captcha é filtro de volume, não
    // sistema de segurança crítico.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resposta = await fetch(VERIFY_URL, {
      method: 'POST',
      body: corpo,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const dados = (await resposta.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (dados.success) return { ok: true };

    return { ok: false, motivo: dados['error-codes']?.join(',') || 'invalid_token' };
  } catch (erro) {
    console.warn('[turnstile] verificação falhou, deixando passar:', erro);
    return { ok: true };
  }
}

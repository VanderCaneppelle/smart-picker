/**
 * E-mails de ciclo de vida do trial. Vão do Rankea para o recrutador, ao contrário
 * dos outros e-mails do sistema, que vão do recrutador para o candidato. Por isso
 * não usam a personalização de remetente do recrutador.
 */

export type TrialEmailKind = 'trial_d7' | 'trial_d1' | 'trial_expired';

export interface TrialEmailData {
  /** Primeiro nome, para a saudação. */
  nome: string;
  diasRestantes: number;
  candidatosAvaliados: number;
  vagasCriadas: number;
  appUrl: string;
}

function botao(url: string, texto: string): string {
  return `<p style="margin:0 0 28px"><a href="${url}" style="display:inline-block;background-color:#059669;color:#ffffff;text-decoration:none;font-weight:500;font-size:15px;padding:12px 22px;border-radius:6px">${texto}</a></p>`;
}

function moldura(conteudo: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background-color:#f9fafb">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb">
${conteudo}
<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#9ca3af">Rankea, seleção simples e decisão inteligente.<br>Você recebe este aviso porque tem uma conta em rankea.ai.</p>
</div></body></html>`;
}

/**
 * O resumo de uso só entra quando existe uso. Dizer "você avaliou 0 candidatos"
 * para quem não usou é lembrar a pessoa de que ela não precisa do produto.
 */
function resumoDeUso(d: TrialEmailData): string {
  if (d.candidatosAvaliados === 0) return '';
  const cand = d.candidatosAvaliados === 1 ? '1 candidato' : `${d.candidatosAvaliados} candidatos`;
  const vagas = d.vagasCriadas === 1 ? '1 vaga' : `${d.vagasCriadas} vagas`;
  return `<p style="margin:0 0 16px">Até aqui a IA já avaliou <strong>${cand}</strong> em ${vagas} suas. Esse trabalho fica salvo na sua conta.</p>`;
}

export function montarTrialEmail(kind: TrialEmailKind, d: TrialEmailData): { subject: string; html: string } {
  const planos = `${d.appUrl}/dashboard/upgrade`;

  if (kind === 'trial_d7') {
    const dias = d.diasRestantes === 1 ? '1 dia' : `${d.diasRestantes} dias`;
    return {
      subject: `Seu teste do Rankea termina em ${dias}`,
      html: moldura(`
<p style="margin:0 0 16px">Oi, ${d.nome}.</p>
<p style="margin:0 0 16px">Seu período de teste termina em <strong>${dias}</strong>.</p>
${resumoDeUso(d)}
<p style="margin:0 0 24px">Se quiser continuar, é só escolher um plano. Leva um minuto e nada do que você já fez se perde.</p>
${botao(planos, 'Ver planos')}
<p style="margin:0">Qualquer dúvida, responde este e-mail que eu leio.</p>`),
    };
  }

  if (kind === 'trial_d1') {
    return {
      subject: 'Seu teste do Rankea termina amanhã',
      html: moldura(`
<p style="margin:0 0 16px">Oi, ${d.nome}.</p>
<p style="margin:0 0 16px">Seu teste termina <strong>amanhã</strong>. Depois disso suas vagas param de receber novas candidaturas e o painel fica bloqueado até você assinar.</p>
${resumoDeUso(d)}
<p style="margin:0 0 24px">Nada é apagado. Assim que assinar, tudo volta exatamente como está.</p>
${botao(planos, 'Escolher um plano')}
<p style="margin:0">Se algo não funcionou como você esperava, me conta respondendo este e-mail. Quero saber.</p>`),
    };
  }

  return {
    subject: 'Seu teste do Rankea terminou',
    html: moldura(`
<p style="margin:0 0 16px">Oi, ${d.nome}.</p>
<p style="margin:0 0 16px">Seu período de teste terminou. Suas vagas pararam de receber candidaturas novas e o painel está bloqueado.</p>
${resumoDeUso(d)}
<p style="margin:0 0 24px">Seus dados continuam salvos. Se assinar, tudo volta no mesmo lugar, sem precisar refazer nada.</p>
${botao(planos, 'Reativar minha conta')}
<p style="margin:0">E se o Rankea não resolveu o seu problema, eu gostaria de entender por quê. Responde este e-mail em uma linha que já me ajuda muito.</p>`),
  };
}

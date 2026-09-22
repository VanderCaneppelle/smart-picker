/**
 * E-mail de convite de equipe: vai do Rankea para o novo usuário, com a senha
 * provisória que o dono acabou de gerar. Como os e-mails de trial, não usa a
 * personalização de remetente do recrutador, porque quem fala aqui é o produto.
 *
 * A senha em claro só existe na chamada que cria o usuário. Ela não é gravada em
 * lugar nenhum: se este e-mail não sair, o caminho é gerar outra pela tela de equipe.
 */

import { resend, FROM_EMAIL } from './resend.js';

export type TeamLocale = 'pt' | 'en';

export interface TeamInviteData {
  memberName: string;
  memberEmail: string;
  ownerName: string;
  companyName: string | null;
  password: string;
  appUrl: string;
  locale: TeamLocale;
}

function botao(url: string, texto: string): string {
  return `<p style="margin:0 0 28px"><a href="${url}" style="display:inline-block;background-color:#059669;color:#ffffff;text-decoration:none;font-weight:500;font-size:15px;padding:12px 22px;border-radius:6px">${texto}</a></p>`;
}

function caixaSenha(label: string, senha: string): string {
  return `<div style="margin:0 0 24px;padding:16px 18px;background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px">
<p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280">${label}</p>
<p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:20px;font-weight:600;letter-spacing:0.05em;color:#111827">${senha}</p>
</div>`;
}

const RODAPE: Record<TeamLocale, string> = {
  pt: 'Rankea, seleção simples e decisão inteligente.<br>Você recebe este e-mail porque alguém criou um acesso para você em rankea.ai.',
  en: 'Rankea, screen less and decide better.<br>You are getting this email because someone created an account for you at rankea.ai.',
};

function moldura(conteudo: string, locale: TeamLocale): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background-color:#f9fafb">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb">
${conteudo}
<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#9ca3af">${RODAPE[locale]}</p>
</div></body></html>`;
}

function montar(d: TeamInviteData): { subject: string; html: string } {
  const login = `${d.appUrl.replace(/\/$/, '')}/login`;
  const primeiroNome = d.memberName.split(' ')[0] || d.memberName;
  const convidou = d.companyName ? `${d.ownerName} (${d.companyName})` : d.ownerName;

  if (d.locale === 'en') {
    return {
      subject: `${d.ownerName} gave you access to Rankea`,
      html: moldura(
        `
<p style="margin:0 0 16px">Hi ${primeiroNome},</p>
<p style="margin:0 0 16px"><strong>${convidou}</strong> created an account for you on Rankea, where the team screens candidates and lets the AI rank them.</p>
<p style="margin:0 0 8px">Sign in with this email (<strong>${d.memberEmail}</strong>) and the temporary password below.</p>
${caixaSenha('Temporary password', d.password)}
${botao(login, 'Sign in')}
<p style="margin:0 0 16px">You will be asked to choose your own password the first time you sign in. This one stops working right after that.</p>
<p style="margin:0;color:#6b7280;font-size:13px">If you were not expecting this, you can ignore the email and the password expires unused.</p>`,
        'en'
      ),
    };
  }

  return {
    subject: `${d.ownerName} liberou seu acesso ao Rankea`,
    html: moldura(
      `
<p style="margin:0 0 16px">Olá ${primeiroNome},</p>
<p style="margin:0 0 16px"><strong>${convidou}</strong> criou um acesso para você no Rankea, onde o time acompanha as vagas e a IA classifica os candidatos.</p>
<p style="margin:0 0 8px">Entre com este e-mail (<strong>${d.memberEmail}</strong>) e a senha provisória abaixo.</p>
${caixaSenha('Senha provisória', d.password)}
${botao(login, 'Entrar no Rankea')}
<p style="margin:0 0 16px">No primeiro acesso o sistema pede para você escolher a sua própria senha. Esta aqui para de funcionar na hora.</p>
<p style="margin:0;color:#6b7280;font-size:13px">Se você não esperava este e-mail, é só ignorar: a senha vence sem ter sido usada.</p>`,
      'pt'
    ),
  };
}

export async function sendTeamInviteEmail(d: TeamInviteData): Promise<void> {
  if (!resend) {
    // Estourar de propósito. O convite é o ÚNICO caminho da senha até a pessoa:
    // engolir a falha aqui criaria um usuário que ninguém consegue acessar.
    throw new Error('RESEND_API_KEY não configurada: não é possível enviar o convite.');
  }

  const { subject, html } = montar(d);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: d.memberEmail,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend recusou o convite: ${error.message}`);
  }
}

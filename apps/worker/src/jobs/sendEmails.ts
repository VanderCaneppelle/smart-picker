import { resend, FROM_EMAIL } from '../lib/resend.js';
import { renderEmailTemplate, type EmailPersonalization } from '../lib/emailTemplates.js';

interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface Job {
  id: string;
  title: string;
  calendly_link?: string | null;
  recruiter?: { email: string } | null;
}

function buildFromAndReply(personalization: EmailPersonalization | null) {
  const fromStr = personalization?.email_sender_name
    ? `${personalization.email_sender_name} <${FROM_EMAIL}>`
    : FROM_EMAIL;
  const replyTo = personalization?.reply_to_email ?? undefined;
  return { from: fromStr, reply_to: replyTo };
}

function varsFor(candidate: Candidate, job: Job, personalization: EmailPersonalization | null, calendlyLink?: string | null) {
  return {
    candidate_name: candidate.name,
    job_title: job.title,
    calendly_link: calendlyLink ?? '',
    sender_name: personalization?.email_sender_name ?? 'A equipe',
    signature: personalization?.email_signature ?? '',
  };
}

function appendSignature(html: string, personalization: EmailPersonalization | null): string {
  if (!personalization?.email_signature?.trim()) return html;
  const sig = personalization.email_signature.trim().replace(/\n/g, '<br>');
  return html.replace('</body>', `<p style="margin-top: 24px;">${sig}</p></body>`);
}

const DEFAULT_APPLICATION_RECEIVED_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Candidatura recebida</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Olá {{candidate_name}},</p>
    <p>Agradecemos sua candidatura para a vaga <strong>{{job_title}}</strong>. Recebemos seu currículo e nossa equipe analisará em breve.</p>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Próximos passos</h3>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        <li>Nossa equipe analisará sua candidatura</li>
        <li>Se seu perfil for compatível, entraremos em contato para agendar uma entrevista</li>
        <li>Você receberá atualizações por e-mail</li>
      </ul>
    </div>
    <p>Qualquer dúvida, responda a este e-mail.</p>
    <p style="margin-bottom: 0;">Atenciosamente,<br><strong>{{sender_name}}</strong></p>
  </div>
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;"><p style="margin: 0;">Enviado via Rankea</p></div>
</body>
</html>
`;

const DEFAULT_SCHEDULE_INTERVIEW_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Você foi selecionado(a)!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Olá {{candidate_name}},</p>
    <p>Parabéns! Você foi selecionado(a) para seguir no processo da vaga <strong>{{job_title}}</strong>.</p>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Próximo passo: agende sua entrevista</h3>
      {{calendly_link}}
    </div>
    <p style="margin-bottom: 0;">Atenciosamente,<br><strong>{{sender_name}}</strong></p>
  </div>
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;"><p style="margin: 0;">Enviado via Rankea</p></div>
</body>
</html>
`;

const DEFAULT_REJECTION_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4b5563 0%, #374151 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Atualização sobre sua candidatura</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Olá {{candidate_name}},</p>
    <p>Obrigado pelo seu interesse na vaga <strong>{{job_title}}</strong> e pelo tempo dedicado.</p>
    <p>Após análise, decidimos seguir com outros candidatos cujo perfil está mais alinhado às necessidades atuais desta vaga.</p>
    <p>Fique à vontade para se candidatar novamente no futuro. Desejamos sucesso na sua busca.</p>
    <p style="margin-bottom: 0;">Atenciosamente,<br><strong>{{sender_name}}</strong></p>
  </div>
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;"><p style="margin: 0;">Enviado via Rankea</p></div>
</body>
</html>
`;

export async function sendEmails(
  candidate: Candidate,
  job: Job,
  personalization: EmailPersonalization | null
): Promise<void> {
  if (!resend) {
    console.log('[Email] Resend not configured (RESEND_API_KEY missing). Skipping all emails.');
    return;
  }

  console.log(`[Email] Sending emails for candidate ${candidate.name} (${candidate.email}), job: ${job.title}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { from, reply_to } = buildFromAndReply(personalization);
  const vars = varsFor(candidate, job, personalization);

  // ---- Candidatura recebida (para o candidato) ----
  const appSubject = personalization?.application_received_subject?.trim() || `Candidatura recebida: ${job.title}`;
  const appBodyRaw = personalization?.application_received_body_html?.trim() || DEFAULT_APPLICATION_RECEIVED_HTML;
  const appBody = appendSignature(renderEmailTemplate(appBodyRaw, vars), personalization);

  try {
    await resend.emails.send({
      from,
      reply_to,
      to: candidate.email,
      subject: renderEmailTemplate(appSubject, vars),
      html: appBody,
    });
    console.log(`[Email] Confirmation email sent to candidate: ${candidate.email}`);
  } catch (error) {
    console.error(`[Email] FAILED to send confirmation to ${candidate.email}:`, error);
  }

  // ---- Notificação para o recrutador (sempre template fixo) ----
  const recruiterEmail = job.recruiter?.email;
  if (recruiterEmail) {
    try {
      await resend.emails.send({
        from,
        to: recruiterEmail,
        subject: `Nova candidatura: ${candidate.name} – ${job.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Nova candidatura</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px;">Nova candidatura recebida:</p>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280;">Vaga:</td><td style="padding: 8px 0; font-weight: 600;">${job.title}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;">Candidato:</td><td style="padding: 8px 0; font-weight: 600;">${candidate.name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;">E-mail:</td><td style="padding: 8px 0;"><a href="mailto:${candidate.email}" style="color: #2563eb;">${candidate.email}</a></td></tr>
                </table>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="${appUrl}/candidates/${candidate.id}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver candidato</a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;"><p style="margin: 0;">Enviado via Rankea</p></div>
          </body>
          </html>
        `,
      });
      console.log(`[Email] Notification sent to recruiter: ${recruiterEmail}`);
    } catch (error) {
      console.error(`[Email] FAILED to send notification to recruiter ${recruiterEmail}:`, error);
    }
  }
}

/** Send "schedule interview" email to candidate (Calendly link from job) */
export async function sendScheduleInterviewEmail(
  candidate: Candidate,
  job: Job & { calendly_link?: string | null },
  personalization: EmailPersonalization | null
): Promise<void> {
  if (!resend) {
    console.log('[Email] Resend not configured. Skipping schedule interview email.');
    return;
  }

  const calendlyLink = job.calendly_link?.trim() || null;
  const vars = varsFor(candidate, job, personalization, calendlyLink);

  const calendlyPlaceholder = calendlyLink
    ? `<p>Agende sua entrevista pelo link abaixo:</p><div style="text-align: center; margin: 24px 0;"><a href="${calendlyLink}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Agendar entrevista (Calendly)</a></div><p>Se o link não abrir, copie e cole no navegador: <br><a href="${calendlyLink}" style="color: #2563eb; word-break: break-all;">${calendlyLink}</a></p>`
    : `<p>Nossa equipe enviará em breve o link para agendamento. Qualquer dúvida, responda a este e-mail.</p>`;

  const bodyRaw = personalization?.schedule_interview_body_html?.trim() || DEFAULT_SCHEDULE_INTERVIEW_HTML;
  const bodyWithCalendly = bodyRaw.replace(/\{\{calendly_link\}\}/g, calendlyPlaceholder);
  const subject = personalization?.schedule_interview_subject?.trim() || `Você foi selecionado(a)! Agende sua entrevista – ${job.title}`;

  const { from, reply_to } = buildFromAndReply(personalization);
  const html = appendSignature(renderEmailTemplate(bodyWithCalendly, vars), personalization);

  try {
    await resend.emails.send({
      from,
      reply_to,
      to: candidate.email,
      subject: renderEmailTemplate(subject, vars),
      html,
    });
    console.log(`[Email] Schedule interview email sent to ${candidate.email}`);
  } catch (error) {
    console.error(`[Email] FAILED schedule interview email to ${candidate.email}:`, error);
    throw error;
  }
}

/** Send rejection email to candidate */
export async function sendRejectionEmail(
  candidate: Candidate,
  job: Job,
  personalization: EmailPersonalization | null
): Promise<void> {
  if (!resend) {
    console.log('[Email] Resend not configured. Skipping rejection email.');
    return;
  }

  const vars = varsFor(candidate, job, personalization);
  const subject = personalization?.rejection_subject?.trim() || `Atualização sobre sua candidatura: ${job.title}`;
  const bodyRaw = personalization?.rejection_body_html?.trim() || DEFAULT_REJECTION_HTML;
  const html = appendSignature(renderEmailTemplate(bodyRaw, vars), personalization);

  const { from, reply_to } = buildFromAndReply(personalization);

  try {
    await resend.emails.send({
      from,
      reply_to,
      to: candidate.email,
      subject: renderEmailTemplate(subject, vars),
      html,
    });
    console.log(`[Email] Rejection email sent to ${candidate.email}`);
  } catch (error) {
    console.error(`[Email] FAILED rejection email to ${candidate.email}:`, error);
    throw error;
  }
}

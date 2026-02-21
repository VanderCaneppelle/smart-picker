/**
 * Textos padrão dos e-mails enviados aos candidatos.
 * Usados como valor inicial nas configurações quando o recrutador ainda não personalizou.
 * Deve estar alinhado com apps/worker/src/jobs/sendEmails.ts
 */

export const DEFAULT_APPLICATION_RECEIVED_SUBJECT = 'Candidatura recebida: {{job_title}}';

export const DEFAULT_APPLICATION_RECEIVED_BODY_HTML = `<!DOCTYPE html>
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

export const DEFAULT_SCHEDULE_INTERVIEW_SUBJECT = "Você foi selecionado(a)! Agende sua entrevista – {{job_title}}";

export const DEFAULT_SCHEDULE_INTERVIEW_BODY_HTML = `<!DOCTYPE html>
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

export const DEFAULT_REJECTION_SUBJECT = 'Atualização sobre sua candidatura: {{job_title}}';

export const DEFAULT_REJECTION_BODY_HTML = `<!DOCTYPE html>
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

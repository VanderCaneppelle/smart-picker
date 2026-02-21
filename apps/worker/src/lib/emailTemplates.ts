/**
 * Substitui placeholders em assunto/corpo de e-mail.
 * Suportados: {{candidate_name}}, {{job_title}}, {{calendly_link}}, {{sender_name}}, {{signature}}
 */
export function renderEmailTemplate(
  template: string,
  vars: {
    candidate_name?: string;
    job_title?: string;
    calendly_link?: string;
    sender_name?: string;
    signature?: string;
  }
): string {
  let out = template;
  out = out.replace(/\{\{candidate_name\}\}/g, vars.candidate_name ?? '');
  out = out.replace(/\{\{job_title\}\}/g, vars.job_title ?? '');
  out = out.replace(/\{\{calendly_link\}\}/g, vars.calendly_link ?? '');
  out = out.replace(/\{\{sender_name\}\}/g, vars.sender_name ?? '');
  out = out.replace(/\{\{signature\}\}/g, vars.signature ?? '');
  return out;
}

export interface EmailPersonalization {
  email_sender_name: string | null;
  reply_to_email: string | null;
  email_signature: string | null;
  application_received_subject: string | null;
  application_received_body_html: string | null;
  schedule_interview_subject: string | null;
  schedule_interview_body_html: string | null;
  rejection_subject: string | null;
  rejection_body_html: string | null;
}

export const DEFAULT_APPLICATION_RECEIVED_SUBJECT = 'Application Received: {{job_title}}';
export const DEFAULT_SCHEDULE_INTERVIEW_SUBJECT = "You're selected! Schedule your interview – {{job_title}}";
export const DEFAULT_REJECTION_SUBJECT = 'Update on your application: {{job_title}}';

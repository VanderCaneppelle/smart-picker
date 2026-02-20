import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY not set. Email sending will be disabled.');
} else {
  console.log('[Resend] API key configured. Email sending enabled.');
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@hunter.ai';

if (FROM_EMAIL.includes('resend.dev')) {
  console.warn(`[Resend] FROM_EMAIL="${FROM_EMAIL}" is the Resend sandbox. Emails can ONLY be sent to the Resend account owner's email. Set a verified custom domain for production use.`);
}

export default resend;

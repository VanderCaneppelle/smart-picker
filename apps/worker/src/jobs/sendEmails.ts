import { resend, FROM_EMAIL, RECRUITER_EMAIL } from '../lib/resend.js';

interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface Job {
  id: string;
  title: string;
  calendly_link?: string | null;
}

export async function sendEmails(candidate: Candidate, job: Job): Promise<void> {
  if (!resend) {
    console.log('Resend not configured. Skipping email sending.');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Send confirmation email to candidate
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: candidate.email,
      subject: `Application Received: ${job.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Received!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi ${candidate.name},</p>
            
            <p>Thank you for applying for the <strong>${job.title}</strong> position. We've received your application and our team will review it shortly.</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>Our team will review your application</li>
                <li>If your profile matches our requirements, we'll reach out to schedule an interview</li>
                <li>You'll receive updates via email</li>
              </ul>
            </div>
            
            <p>If you have any questions, feel free to reply to this email.</p>
            
            <p style="margin-bottom: 0;">Best regards,<br><strong>The Hiring Team</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">This email was sent by Hunter AI</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Confirmation email sent to candidate: ${candidate.email}`);
  } catch (error) {
    console.error('Error sending confirmation email to candidate:', error);
  }

  // Send notification email to recruiter
  if (RECRUITER_EMAIL) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: RECRUITER_EMAIL,
        subject: `New Application: ${candidate.name} for ${job.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Application Received</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px;">A new candidate has applied for a position:</p>
              
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Position:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${job.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Candidate:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${candidate.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:${candidate.email}" style="color: #2563eb;">${candidate.email}</a></td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${appUrl}/candidates/${candidate.id}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Candidate</a>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">This email was sent by Hunter AI</p>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`Notification email sent to recruiter: ${RECRUITER_EMAIL}`);
    } catch (error) {
      console.error('Error sending notification email to recruiter:', error);
    }
  }
}

/** Send "schedule interview" email to candidate with Calendly link from the job */
export async function sendScheduleInterviewEmail(
  candidate: Candidate,
  job: Job & { calendly_link?: string | null }
): Promise<void> {
  if (!resend) {
    console.log('Resend not configured. Skipping schedule interview email.');
    return;
  }

  const calendlyLink = job.calendly_link?.trim() || null;
  const hasCalendly = !!calendlyLink;

  const calendlySection = hasCalendly
    ? `
      <p>Please schedule your interview using the link below:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${calendlyLink}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Agendar entrevista (Calendly)</a>
      </div>
      <p>If the link doesn't work, copy and paste it into your browser: <br><a href="${calendlyLink}" style="color: #2563eb; word-break: break-all;">${calendlyLink}</a></p>
    `
    : `
      <p>Our team will send you the interview scheduling link shortly. If you have any questions, reply to this email.</p>
    `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: candidate.email,
      subject: `You're selected! Schedule your interview – ${job.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You're selected!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi ${candidate.name},</p>
            
            <p>Congratulations! We're pleased to inform you that you've been selected to move forward in the process for the <strong>${job.title}</strong> position.</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Next step: schedule your interview</h3>
              ${calendlySection}
            </div>
            
            <p style="margin-bottom: 0;">Best regards,<br><strong>The Hiring Team</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">This email was sent by Rankea</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Schedule interview email sent to candidate: ${candidate.email}`);
  } catch (error) {
    console.error('Error sending schedule interview email to candidate:', error);
    throw error;
  }
}

import type { CandidateStatus } from '@hunter/core';

/** Status que disparam envio de e-mail e exigem confirmação antes de aplicar */
export const EMAIL_TRIGGER_STATUSES: CandidateStatus[] = [
  'schedule_interview',
  'hired',
  'rejected',
];

export const STATUS_EMAIL_MESSAGES: Record<string, string> = {
  schedule_interview: 'Um e-mail de agendamento de entrevista será enviado ao candidato.',
  hired: 'Um e-mail de contratação será enviado ao candidato.',
  rejected: 'Um e-mail de rejeição será enviado ao candidato.',
};

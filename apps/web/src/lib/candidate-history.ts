import { prisma } from '@/lib/db';

export type CandidateEventType =
  | 'application_submitted'
  | 'status_changed'
  | 'email_sent_interview'
  | 'email_sent_rejection'
  | 'score_recalculated';

interface LogCandidateEventParams {
  candidateId: string;
  jobId: string;
  eventType: CandidateEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

/**
 * Best-effort event logging. Never throws to avoid breaking main flows.
 */
export async function logCandidateEvent(params: LogCandidateEventParams): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO candidate_events (
        id, candidate_id, job_id, event_type, from_status, to_status, message, metadata, created_by, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${params.candidateId},
        ${params.jobId},
        ${params.eventType},
        ${params.fromStatus ?? null},
        ${params.toStatus ?? null},
        ${params.message ?? null},
        ${params.metadata ? JSON.stringify(params.metadata) : null}::jsonb,
        ${params.createdBy ?? null},
        NOW()
      )
    `;
  } catch (error) {
    console.warn('[CandidateHistory] Failed to log event:', error);
  }
}


import { prisma } from '@/lib/db';

/**
 * Canonical pipeline statuses used by the app.
 */
export const PIPELINE_STATUS_ORDER = [
  'new',
  'reviewing',
  'interview',
  'in_validation',
  'hired',
  'rejected',
] as const;

/**
 * Legacy-to-new status mapping for data migration.
 */
export const LEGACY_STATUS_MAP: Record<string, string> = {
  schedule_interview: 'interview',
  shortlisted: 'in_validation',
  flagged: 'new',
};

/**
 * Migrates legacy candidate statuses to the current canonical statuses.
 * Safe to run multiple times (idempotent).
 */
export async function migrateLegacyCandidateStatusesForRecruiter(userId: string): Promise<void> {
  const jobFilter = { user_id: userId, deleted_at: null };
  await prisma.candidate.updateMany({
    where: {
      status: 'schedule_interview',
      deleted_at: null,
      job: jobFilter,
    },
    data: { status: 'interview' },
  });
  await prisma.candidate.updateMany({
    where: {
      status: 'shortlisted',
      deleted_at: null,
      job: jobFilter,
    },
    data: { status: 'in_validation' },
  });
  await prisma.candidate.updateMany({
    where: {
      status: 'flagged',
      deleted_at: null,
      job: jobFilter,
    },
    data: { status: 'new' },
  });
}

import { prisma } from '../lib/db.js';
import { scoreCandidate } from './scoreCandidate.js';
import { sendEmails } from './sendEmails.js';
import type { ResumeIntegrityResult } from '../lib/resumeIntegrity.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);

/** Identificador do flag de integridade, para não duplicar ao recalcular a nota. */
const INTEGRITY_FLAG_ID = 'resume_integrity';

interface ExistingFlag {
  question_id?: string;
  [key: string]: unknown;
}

/**
 * Monta os campos de alerta a partir da checagem de integridade do currículo,
 * preservando os flags já gravados pelas perguntas eliminatórias e substituindo
 * apenas o flag de integridade anterior (caso a nota esteja sendo recalculada).
 */
function buildIntegrityUpdate(
  candidate: { disqualification_flags: unknown; flagged_reason: string | null },
  integrity: ResumeIntegrityResult
) {
  const previous = Array.isArray(candidate.disqualification_flags)
    ? (candidate.disqualification_flags as ExistingFlag[])
    : [];
  const withoutIntegrity = previous.filter((f) => f?.question_id !== INTEGRITY_FLAG_ID);

  // Remove o texto de integridade anterior para não acumular a cada recálculo.
  const previousReason = (candidate.flagged_reason ?? '')
    .split(' | ')
    .filter((part) => part && !part.startsWith('Possível manipulação da triagem:'))
    .join(' | ');

  if (!integrity.manipulated) {
    return {
      disqualification_flags: withoutIntegrity as never,
      flagged_reason: previousReason || null,
    };
  }

  const integrityFlags = integrity.signals.map((signal) => ({
    question_id: INTEGRITY_FLAG_ID,
    question_text: 'Integridade do currículo',
    candidate_answer: signal.excerpt,
    severity: integrity.severity,
    reason: signal.label,
  }));

  return {
    disqualification_flags: [...withoutIntegrity, ...integrityFlags] as never,
    flagged_reason: [previousReason, integrity.summary].filter(Boolean).join(' | '),
  };
}

export interface ProcessCandidateOptions {
  /** When true, only recalculate score; do not send "candidatura recebida" or recruiter notification. Used for "recalcular nota". */
  skipEmails?: boolean;
}

/** Process a single candidate by ID (event-driven). */
export async function processCandidate(
  candidateId: string,
  options?: ProcessCandidateOptions
): Promise<{ ok: boolean; error?: string }> {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, deleted_at: null, needs_scoring: true },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            application_questions: true,
            resume_weight: true,
            answers_weight: true,
            scoring_instructions: true,
            calendly_link: true,
            recruiter: {
              include: { emailPersonalization: true },
            },
          },
        },
      },
    });

    if (!candidate) {
      return { ok: false, error: 'Candidate not found or already processed' };
    }

    console.log(`Processing candidate: ${candidate.name} (${candidate.id})${options?.skipEmails ? ' (score only, no emails)' : ''}`);

    const scores = await scoreCandidate(candidate);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        fit_score: scores.fit_score,
        resume_rating: scores.resume_rating,
        answer_quality_rating: scores.answer_quality_rating,
        resume_summary: scores.resume_summary,
        experience_level: scores.experience_level,
        needs_scoring: false,
        ...buildIntegrityUpdate(candidate, scores.integrity),
      },
    });

    if (!options?.skipEmails) {
      const personalization = candidate.job.recruiter?.emailPersonalization ?? null;
      await sendEmails(candidate, candidate.job, personalization);
    }

    console.log(`Candidate ${candidate.id} processed successfully.`);
    return { ok: true };
  } catch (error) {
    console.error(`Error processing candidate ${candidateId}:`, error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function processQueue() {
  // Find candidates that need scoring
  const pendingCandidates = await prisma.candidate.findMany({
    where: {
      needs_scoring: true,
      deleted_at: null,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          description: true,
          application_questions: true,
          resume_weight: true,
          answers_weight: true,
          scoring_instructions: true,
          calendly_link: true,
          recruiter: {
            select: { email: true },
            include: { emailPersonalization: true },
          },
        },
      },
    },
    take: BATCH_SIZE,
    orderBy: {
      created_at: 'asc', // Process oldest first
    },
  });

  if (pendingCandidates.length === 0) {
    console.log('No candidates to process.');
    return;
  }

  console.log(`Found ${pendingCandidates.length} candidates to process.`);

  for (const candidate of pendingCandidates) {
    try {
      console.log(`Processing candidate: ${candidate.name} (${candidate.id})`);

      // Score the candidate
      const scores = await scoreCandidate(candidate);

      // Update candidate with scores
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fit_score: scores.fit_score,
          resume_rating: scores.resume_rating,
          answer_quality_rating: scores.answer_quality_rating,
          resume_summary: scores.resume_summary,
          experience_level: scores.experience_level,
          needs_scoring: false,
          ...buildIntegrityUpdate(candidate, scores.integrity),
        },
      });

      console.log(`Candidate ${candidate.id} scored successfully.`);

      const personalization = candidate.job.recruiter?.emailPersonalization ?? null;
      await sendEmails(candidate, candidate.job, personalization);

      console.log(`Emails sent for candidate ${candidate.id}.`);
    } catch (error) {
      console.error(`Error processing candidate ${candidate.id}:`, error);

      // Mark as processed to avoid infinite retries
      // In production, you might want a retry counter
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          needs_scoring: false,
        },
      });
    }
  }
}

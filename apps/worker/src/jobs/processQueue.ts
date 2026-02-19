import { prisma } from '../lib/db.js';
import { scoreCandidate } from './scoreCandidate.js';
import { sendEmails } from './sendEmails.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);

/** Process a single candidate by ID (event-driven) */
export async function processCandidate(candidateId: string): Promise<{ ok: boolean; error?: string }> {
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
            recruiter: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!candidate) {
      return { ok: false, error: 'Candidate not found or already processed' };
    }

    console.log(`Processing candidate: ${candidate.name} (${candidate.id})`);

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
      },
    });

    await sendEmails(candidate, candidate.job);

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
          recruiter: {
            select: { email: true },
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
        },
      });

      console.log(`Candidate ${candidate.id} scored successfully.`);

      // Send emails
      await sendEmails(candidate, candidate.job);

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

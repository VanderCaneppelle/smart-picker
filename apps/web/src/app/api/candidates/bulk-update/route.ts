import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAccount } from '@/lib/auth';
import { CandidateStatusSchema } from '@hunter/core';
import { z } from 'zod';
import { triggerRejectionEmail } from '@/lib/worker';
import { isPlaceholderEmail } from '@/lib/placeholder-email';
import { migrateLegacyCandidateStatusesForRecruiter } from '@/lib/candidate-status';
import { logCandidateEvent } from '@/lib/candidate-history';

const BulkUpdateSchema = z.object({
  candidate_ids: z.array(z.string().uuid()).min(1, 'At least one candidate is required'),
  status: CandidateStatusSchema,
});

// POST /api/candidates/bulk-update - Bulk update candidate statuses
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAccount(request);
    if (auth.response) return auth.response;

    await migrateLegacyCandidateStatusesForRecruiter(auth.ctx.accountId);

    const body = await request.json();
    const validation = BulkUpdateSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          error: 'Bad Request',
          message: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { candidate_ids, status } = validation.data;

    const candidates = await prisma.candidate.findMany({
      where: {
        id: { in: candidate_ids },
        deleted_at: null,
        job: {
          user_id: auth.ctx.accountId,
          deleted_at: null,
        },
      },
      select: { id: true, status: true, job_id: true, email: true },
    });

    if (candidates.length === 0) {
      return Response.json(
        { error: 'Not Found', message: 'No candidates found' },
        { status: 404 }
      );
    }

    const validIds = candidates.map((c) => c.id);

    await prisma.candidate.updateMany({
      where: { id: { in: validIds } },
      data: { status },
    });

    for (const candidate of candidates) {
      if (candidate.status !== status) {
        await logCandidateEvent({
          candidateId: candidate.id,
          jobId: candidate.job_id,
          eventType: 'status_changed',
          fromStatus: candidate.status,
          toStatus: status,
          message: `Status alterado de ${candidate.status} para ${status} (ação em massa)`,
          metadata: { source: 'bulk_update' },
          createdBy: auth.ctx.id,
        });
      }
    }

    // Trigger rejection emails sequentially to avoid overwhelming the worker.
    // Quem ainda está com o e-mail provisório da importação fica de fora: o endereço
    // não existe, então o envio só produziria bounce.
    let semEmailValido = 0;
    if (status === 'rejected') {
      for (const candidate of candidates) {
        if (isPlaceholderEmail(candidate.email)) {
          semEmailValido += 1;
          continue;
        }
        await triggerRejectionEmail(candidate.id);
      }
    }

    return Response.json({
      message: `${validIds.length} candidato(s) atualizado(s)`,
      updated_count: validIds.length,
      /** Quantos tiveram o e-mail pulado por ainda estarem com endereço provisório. */
      skipped_placeholder_email: semEmailValido,
    });
  } catch (error) {
    console.error('Error bulk updating candidates:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to bulk update candidates' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { CandidateStatusSchema } from '@hunter/core';
import { z } from 'zod';
import { triggerRejectionEmail } from '@/lib/worker';
import { migrateLegacyCandidateStatusesForRecruiter } from '@/lib/candidate-status';

const BulkUpdateSchema = z.object({
  candidate_ids: z.array(z.string().uuid()).min(1, 'At least one candidate is required'),
  status: CandidateStatusSchema,
});

// POST /api/candidates/bulk-update - Bulk update candidate statuses
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    await migrateLegacyCandidateStatusesForRecruiter(user.id);

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
          user_id: user.id,
          deleted_at: null,
        },
      },
      select: { id: true, status: true },
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

    // Trigger rejection emails sequentially to avoid overwhelming the worker
    if (status === 'rejected') {
      for (const id of validIds) {
        await triggerRejectionEmail(id);
      }
    }

    return Response.json({
      message: `${validIds.length} candidato(s) atualizado(s)`,
      updated_count: validIds.length,
    });
  } catch (error) {
    console.error('Error bulk updating candidates:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to bulk update candidates' },
      { status: 500 }
    );
  }
}

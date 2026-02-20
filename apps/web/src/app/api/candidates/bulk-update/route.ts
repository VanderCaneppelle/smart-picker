import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { CandidateStatusSchema } from '@hunter/core';
import { z } from 'zod';
import { triggerRejectionEmail } from '@/lib/worker';

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

    const updateData: Record<string, unknown> = { status };

    // Clear flagged_reason when moving away from flagged
    const flaggedIds = candidates.filter((c) => c.status === 'flagged').map((c) => c.id);
    if (status !== 'flagged' && flaggedIds.length > 0) {
      await prisma.candidate.updateMany({
        where: { id: { in: flaggedIds } },
        data: { status, flagged_reason: null },
      });

      const nonFlaggedIds = validIds.filter((id) => !flaggedIds.includes(id));
      if (nonFlaggedIds.length > 0) {
        await prisma.candidate.updateMany({
          where: { id: { in: nonFlaggedIds } },
          data: updateData,
        });
      }
    } else {
      await prisma.candidate.updateMany({
        where: { id: { in: validIds } },
        data: updateData,
      });
    }

    // Trigger rejection emails for each candidate moved to rejected
    if (status === 'rejected') {
      for (const id of validIds) {
        triggerRejectionEmail(id);
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

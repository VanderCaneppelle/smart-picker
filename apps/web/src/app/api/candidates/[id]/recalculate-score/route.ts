import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse, jobBelongsToUser } from '@/lib/auth';
import { triggerWorkerProcess } from '@/lib/worker';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/candidates/:id/recalculate-score - Mark candidate for rescoring and trigger worker
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const candidate = await prisma.candidate.findFirst({
      where: { id, deleted_at: null },
      include: { job: { select: { user_id: true } } },
    });

    if (!candidate || !jobBelongsToUser(candidate.job, user)) {
      return Response.json(
        { error: 'Not Found', message: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Mark candidate for rescoring (worker only processes candidates with needs_scoring=true)
    await prisma.candidate.update({
      where: { id },
      data: { needs_scoring: true },
    });

    // Trigger the worker to process this candidate
    triggerWorkerProcess(id);

    return Response.json({
      message: 'Recalculation started. Score will be updated shortly.',
    });
  } catch (error) {
    console.error('Error triggering recalculation:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to trigger recalculation' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAccount, jobBelongsToAccount } from '@/lib/auth';
import { migrateLegacyCandidateStatusesForRecruiter } from '@/lib/candidate-status';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/:id/candidates - Get candidates for a job (protected)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAccount(request);
    if (auth.response) return auth.response;

    await migrateLegacyCandidateStatusesForRecruiter(auth.ctx.accountId);

    const { id } = await params;

    // Check if job exists and belongs to the account
    const job = await prisma.job.findFirst({
      where: { id, deleted_at: null },
    });

    if (!job || !jobBelongsToAccount(job, auth.ctx)) {
      return Response.json(
        { error: 'Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        job_id: id,
        deleted_at: null,
      },
      include: {
        job: {
          select: { application_questions: true },
        },
      },
      orderBy: [
        { fit_score: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return Response.json({
      candidates,
      total: candidates.length,
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

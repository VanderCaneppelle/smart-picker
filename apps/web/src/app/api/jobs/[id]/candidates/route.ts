import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/:id/candidates - Get candidates for a job (protected)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Check if job exists
    const job = await prisma.job.findFirst({
      where: { id, deleted_at: null },
    });

    if (!job) {
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

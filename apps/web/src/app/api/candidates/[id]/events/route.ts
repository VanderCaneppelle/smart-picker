import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse, jobBelongsToUser } from '@/lib/auth';
import { migrateLegacyCandidateStatusesForRecruiter } from '@/lib/candidate-status';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CandidateEventRow {
  id: string;
  candidate_id: string;
  job_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  message: string | null;
  metadata: unknown;
  created_by: string | null;
  created_at: Date | string;
}

// GET /api/candidates/:id/events - Timeline de eventos do candidato (protected)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    await migrateLegacyCandidateStatusesForRecruiter(user.id);

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

    let rows: CandidateEventRow[] = [];
    try {
      rows = await prisma.$queryRaw<CandidateEventRow[]>`
        SELECT
          id,
          candidate_id,
          job_id,
          event_type,
          from_status,
          to_status,
          message,
          metadata,
          created_by,
          created_at
        FROM candidate_events
        WHERE candidate_id = ${id}
        ORDER BY created_at DESC
        LIMIT 200
      `;
    } catch (error) {
      console.warn('[CandidateHistory] candidate_events table not available yet:', error);
      return Response.json({ events: [], total: 0 });
    }

    return Response.json({
      events: rows.map((r) => ({
        id: r.id,
        candidate_id: r.candidate_id,
        job_id: r.job_id,
        event_type: r.event_type,
        from_status: r.from_status,
        to_status: r.to_status,
        message: r.message,
        metadata: r.metadata,
        created_by: r.created_by,
        created_at: typeof r.created_at === 'string' ? r.created_at : r.created_at.toISOString(),
      })),
      total: rows.length,
    });
  } catch (error) {
    console.error('Error fetching candidate events:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch candidate events' },
      { status: 500 }
    );
  }
}


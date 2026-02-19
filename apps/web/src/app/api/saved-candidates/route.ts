import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse, jobBelongsToUser } from '@/lib/auth';

// GET /api/saved-candidates - Lista candidatos salvos do recrutador (com dados do candidato)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const saved = (prisma as { savedCandidate?: { findMany: (args: unknown) => Promise<unknown[]> } }).savedCandidate;
    if (!saved) {
      const idsOnly = new URL(request.url).searchParams.get('ids') === 'true';
      if (idsOnly) return Response.json({ candidateIds: [] });
      return Response.json({ savedCandidates: [], candidates: [] });
    }

    const { searchParams } = new URL(request.url);
    const idsOnly = searchParams.get('ids') === 'true';

    if (idsOnly) {
      const list = await saved.findMany({
        where: { recruiter_id: user.id },
        select: { candidate_id: true },
      }) as { candidate_id: string }[];
      return Response.json({
        candidateIds: list.map((s) => s.candidate_id),
      });
    }

    const list = await saved.findMany({
      where: { recruiter_id: user.id },
      orderBy: { created_at: 'desc' },
      include: {
        candidate: {
          include: {
            job: {
              select: { id: true, title: true },
            },
          },
        },
      },
    }) as Array<{ candidate: { deleted_at: Date | null; job: { id: string; title: string } } & Record<string, unknown> }>;

    const candidates = list
      .map((s) => s.candidate)
      .filter((c) => c && !c.deleted_at);

    return Response.json({ savedCandidates: list, candidates });
  } catch (error) {
    console.error('Error fetching saved candidates:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch saved candidates' },
      { status: 500 }
    );
  }
}

// POST /api/saved-candidates - Salvar candidato (body: { candidate_id })
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const candidateId =
      typeof body.candidate_id === 'string' ? body.candidate_id.trim() : null;

    if (!candidateId) {
      return Response.json(
        { error: 'Bad Request', message: 'candidate_id is required' },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, deleted_at: null },
      include: { job: { select: { user_id: true } } },
    });

    if (!candidate || !jobBelongsToUser(candidate.job, user)) {
      return Response.json(
        { error: 'Not Found', message: 'Candidate not found' },
        { status: 404 }
      );
    }

    const saved = (prisma as { savedCandidate?: { findUnique: (args: unknown) => Promise<unknown>; create: (args: unknown) => Promise<unknown> } }).savedCandidate;
    if (!saved) {
      console.error('Prisma client missing savedCandidate model. Run: pnpm exec prisma generate (with dev server stopped).');
      return Response.json(
        { error: 'Service Unavailable', message: 'Saved candidates not available. Restart the server after running prisma generate.' },
        { status: 503 }
      );
    }

    const existing = await saved.findUnique({
      where: {
        recruiter_id_candidate_id: {
          recruiter_id: user.id,
          candidate_id: candidateId,
        },
      },
    });
    if (!existing) {
      await saved.create({
        data: {
          recruiter_id: user.id,
          candidate_id: candidateId,
        },
      });
    }

    return Response.json({ message: 'Candidate saved' });
  } catch (error) {
    console.error('Error saving candidate:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to save candidate' },
      { status: 500 }
    );
  }
}

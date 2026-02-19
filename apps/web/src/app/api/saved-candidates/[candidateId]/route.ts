import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ candidateId: string }>;
}

// DELETE /api/saved-candidates/:candidateId - Remover candidato dos salvos
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { candidateId } = await params;

    const saved = (prisma as { savedCandidate?: { deleteMany: (args: unknown) => Promise<unknown> } }).savedCandidate;
    if (saved) {
      await saved.deleteMany({
        where: {
          recruiter_id: user.id,
          candidate_id: candidateId,
        },
      });
    }

    return Response.json({ message: 'Removed from saved' });
  } catch (error) {
    console.error('Error removing saved candidate:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to remove' },
      { status: 500 }
    );
  }
}

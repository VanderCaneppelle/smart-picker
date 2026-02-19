import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

// GET /api/dashboard/stats - Métricas do recrutador (vagas, candidatos, médias)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const [jobs, candidatesResult] = await Promise.all([
      prisma.job.findMany({
        where: { deleted_at: null, user_id: user.id },
        select: {
          id: true,
          status: true,
          created_at: true,
          _count: { select: { candidates: { where: { deleted_at: null } } } },
        },
      }),
      prisma.candidate.count({
        where: {
          deleted_at: null,
          job: { user_id: user.id, deleted_at: null },
        },
      }),
    ]);

    const totalJobs = jobs.length;
    const openJobs = jobs.filter((j) => j.status === 'active').length;
    const totalCandidates = candidatesResult;
    const jobsWithCandidates = jobs.filter((j) => j._count.candidates > 0);
    const avgCandidatesPerJob =
      totalJobs > 0 ? Math.round((totalCandidates / totalJobs) * 10) / 10 : 0;

    const now = new Date();
    const activeJobs = jobs.filter((j) => j.status === 'active');
    const avgDaysOpen =
      activeJobs.length > 0
        ? Math.round(
            activeJobs.reduce((acc, j) => {
              const days = (now.getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24);
              return acc + days;
            }, 0) / activeJobs.length
          )
        : 0;

    const shortlistedCount = await prisma.candidate.count({
      where: {
        deleted_at: null,
        status: 'shortlisted',
        job: { user_id: user.id, deleted_at: null },
      },
    });

    return Response.json({
      openJobs,
      totalJobs,
      totalCandidates,
      avgCandidatesPerJob,
      avgDaysJobOpen: avgDaysOpen,
      shortlistedCount,
      jobsWithCandidates: jobsWithCandidates.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Detalhe de uma conta para o admin: vagas, candidaturas e última atividade.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const { id } = await params;

  const recruiter = await prisma.recruiter.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      phone_number: true,
      created_at: true,
      account_owner_id: true,
      subscription: {
        select: {
          status: true,
          plan: true,
          trial_ends_at: true,
          current_period_end: true,
        },
      },
      members: { select: { id: true, email: true, name: true, created_at: true } },
    },
  });

  if (!recruiter) {
    return Response.json({ error: 'Not Found', message: 'Not Found' }, { status: 404 });
  }

  const jobs = await prisma.job.findMany({
    where: { user_id: id, deleted_at: null },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      created_at: true,
      _count: { select: { candidates: { where: { deleted_at: null } } } },
    },
  });

  const ultimaCandidatura = await prisma.candidate.findFirst({
    where: { deleted_at: null, job: { user_id: id } },
    orderBy: { created_at: 'desc' },
    select: { created_at: true },
  });

  const totalCandidatos = jobs.reduce((soma, j) => soma + j._count.candidates, 0);

  return Response.json({
    recruiter: {
      id: recruiter.id,
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      phone_number: recruiter.phone_number,
      created_at: recruiter.created_at,
      is_team_member: recruiter.account_owner_id !== null,
    },
    subscription: recruiter.subscription,
    team: recruiter.members,
    summary: {
      jobsTotal: jobs.length,
      jobsActive: jobs.filter((j) => j.status === 'active').length,
      candidatesTotal: totalCandidatos,
      lastJobCreatedAt: jobs[0]?.created_at ?? null,
      lastCandidateAt: ultimaCandidatura?.created_at ?? null,
    },
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      created_at: j.created_at,
      candidates: j._count.candidates,
    })),
  });
}

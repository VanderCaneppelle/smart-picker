import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const userId = user.id;
    const now = new Date();

    const [
      jobs,
      allCandidates,
      shortlistedCount,
      interviewCount,
      hiredCount,
      rejectedCount,
      reviewingCount,
    ] = await Promise.all([
      prisma.job.findMany({
        where: { deleted_at: null, user_id: userId },
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
          _count: { select: { candidates: { where: { deleted_at: null } } } },
        },
      }),
      prisma.candidate.findMany({
        where: {
          deleted_at: null,
          job: { user_id: userId, deleted_at: null },
        },
        select: {
          id: true,
          status: true,
          fit_score: true,
          created_at: true,
          updated_at: true,
          job_id: true,
          disqualification_flags: true,
        },
      }),
      prisma.candidate.count({
        where: { deleted_at: null, status: 'shortlisted', job: { user_id: userId, deleted_at: null } },
      }),
      prisma.candidate.count({
        where: { deleted_at: null, status: 'schedule_interview', job: { user_id: userId, deleted_at: null } },
      }),
      prisma.candidate.count({
        where: { deleted_at: null, status: 'hired', job: { user_id: userId, deleted_at: null } },
      }),
      prisma.candidate.count({
        where: { deleted_at: null, status: 'rejected', job: { user_id: userId, deleted_at: null } },
      }),
      prisma.candidate.count({
        where: { deleted_at: null, status: 'reviewing', job: { user_id: userId, deleted_at: null } },
      }),
    ]);

    // ---- VISÃO GERAL ----
    const totalJobs = jobs.length;
    const openJobs = jobs.filter((j) => j.status === 'active').length;
    const totalCandidates = allCandidates.length;
    const activeCandidates = allCandidates.filter((c) => c.status !== 'rejected').length;
    const avgCandidatesPerJob = totalJobs > 0 ? Math.round((totalCandidates / totalJobs) * 10) / 10 : 0;

    const activeJobs = jobs.filter((j) => j.status === 'active');
    const avgDaysOpen = activeJobs.length > 0
      ? Math.round(activeJobs.reduce((acc, j) => acc + (now.getTime() - new Date(j.created_at).getTime()) / 86400000, 0) / activeJobs.length)
      : 0;

    const pendingReview = allCandidates.filter((c) => c.status === 'new').length;
    const staleJobs = activeJobs.filter((j) => {
      const daysSinceCreated = (now.getTime() - new Date(j.created_at).getTime()) / 86400000;
      return daysSinceCreated > 14 && j._count.candidates === 0;
    });

    // ---- INTELIGÊNCIA E AUTOMAÇÃO ----
    interface DQFlag { severity: string; question_text?: string; reason?: string }

    const candidatesWithFlags = allCandidates.filter((c) => {
      const flags = c.disqualification_flags as DQFlag[] | null;
      return flags && Array.isArray(flags) && flags.length > 0;
    });

    const eliminatedByFlags = candidatesWithFlags.filter((c) => {
      const flags = c.disqualification_flags as DQFlag[];
      return flags.some((f) => f.severity === 'eliminated');
    });

    const warningFlags = candidatesWithFlags.filter((c) => {
      const flags = c.disqualification_flags as DQFlag[];
      return flags.every((f) => f.severity === 'warning');
    });

    const autoFilteredPercent = totalCandidates > 0
      ? Math.round((eliminatedByFlags.length / totalCandidates) * 100)
      : 0;

    const flaggedForReviewPercent = totalCandidates > 0
      ? Math.round((warningFlags.length / totalCandidates) * 100)
      : 0;

    const criteriaCount: Record<string, number> = {};
    candidatesWithFlags.forEach((c) => {
      const flags = c.disqualification_flags as DQFlag[];
      flags.forEach((f) => {
        const key = f.question_text || 'Desconhecido';
        criteriaCount[key] = (criteriaCount[key] || 0) + 1;
      });
    });
    const topCriteria = Object.entries(criteriaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const scoresByJob: Record<string, { scores: number[]; title: string }> = {};
    jobs.forEach((j) => { scoresByJob[j.id] = { scores: [], title: j.title }; });
    allCandidates.forEach((c) => {
      if (c.fit_score != null && scoresByJob[c.job_id]) {
        scoresByJob[c.job_id].scores.push(c.fit_score);
      }
    });

    const avgScorePerJob = Object.entries(scoresByJob)
      .filter(([, v]) => v.scores.length > 0)
      .map(([jobId, v]) => ({
        jobId,
        title: v.title,
        avgScore: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
        candidateCount: v.scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const allScores = allCandidates
      .filter((c) => c.fit_score != null)
      .map((c) => c.fit_score as number);
    const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
    const avgGlobalScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // ---- PERFORMANCE DO PROCESSO ----
    const funnel = [
      { stage: 'Novos', count: allCandidates.filter((c) => c.status === 'new').length },
      { stage: 'Em revisão', count: reviewingCount },
      { stage: 'Entrevista', count: interviewCount },
      { stage: 'Shortlist', count: shortlistedCount },
      { stage: 'Contratados', count: hiredCount },
    ];

    const shortlistedCandidates = allCandidates.filter((c) => c.status === 'shortlisted' || c.status === 'hired');
    const avgDaysToShortlist = shortlistedCandidates.length > 0
      ? Math.round(
          shortlistedCandidates.reduce((acc, c) => {
            return acc + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 86400000;
          }, 0) / shortlistedCandidates.length
        )
      : 0;

    const hiredCandidates = allCandidates.filter((c) => c.status === 'hired');
    const avgDaysToHire = hiredCandidates.length > 0
      ? Math.round(
          hiredCandidates.reduce((acc, c) => {
            return acc + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 86400000;
          }, 0) / hiredCandidates.length
        )
      : 0;

    const lowConversionJobs = activeJobs
      .filter((j) => {
        const candidates = allCandidates.filter((c) => c.job_id === j.id);
        const advanced = candidates.filter((c) => ['reviewing', 'schedule_interview', 'shortlisted', 'hired'].includes(c.status));
        return candidates.length >= 3 && (advanced.length / candidates.length) < 0.2;
      })
      .map((j) => ({ id: j.id, title: j.title, totalCandidates: j._count.candidates }));

    // ---- INSIGHTS DA SEMANA ----
    const insights: string[] = [];

    if (pendingReview > 5) {
      insights.push(`Você tem ${pendingReview} candidatos aguardando revisão. Priorize os de maior fit score.`);
    }
    if (staleJobs.length > 0) {
      insights.push(`${staleJobs.length} vaga(s) ativa(s) há mais de 14 dias sem candidatos. Considere divulgar mais.`);
    }
    if (autoFilteredPercent > 30) {
      insights.push(`${autoFilteredPercent}% dos candidatos estão sendo eliminados automaticamente. Revise seus critérios eliminatórios.`);
    }
    if (lowConversionJobs.length > 0) {
      insights.push(`${lowConversionJobs.length} vaga(s) com baixa taxa de conversão. Revise a descrição ou critérios.`);
    }
    if (bestScore >= 90) {
      insights.push(`Candidato com score ${bestScore}% identificado! Avalie priorizar o contato.`);
    }
    if (avgGlobalScore > 0 && avgGlobalScore < 50) {
      insights.push(`Score médio de ${avgGlobalScore}% está baixo. Considere ajustar os pesos da avaliação ou divulgar em canais mais qualificados.`);
    }
    if (interviewCount > 3) {
      insights.push(`${interviewCount} candidatos em fase de entrevista. Mantenha o ritmo para não perder talentos.`);
    }
    if (hiredCount > 0 && avgDaysToHire > 0) {
      insights.push(`Tempo médio até contratação: ${avgDaysToHire} dias. ${avgDaysToHire > 30 ? 'Considere agilizar o processo.' : 'Bom ritmo!'}`);
    }
    if (insights.length === 0) {
      insights.push('Comece criando vagas e recebendo candidatos para ver insights personalizados aqui.');
    }

    return Response.json({
      overview: {
        openJobs,
        totalJobs,
        totalCandidates,
        activeCandidates,
        interviewCount,
        shortlistedCount,
        hiredCount,
        rejectedCount,
        avgCandidatesPerJob,
        avgDaysJobOpen: avgDaysOpen,
        pendingReview,
        staleJobsCount: staleJobs.length,
        staleJobs: staleJobs.map((j) => ({ id: j.id, title: j.title })),
      },
      intelligence: {
        autoFilteredPercent,
        flaggedForReviewPercent,
        eliminatedCount: eliminatedByFlags.length,
        warningCount: warningFlags.length,
        topCriteria,
        avgScorePerJob: avgScorePerJob.slice(0, 5),
        bestScore,
        avgGlobalScore,
      },
      performance: {
        funnel,
        avgDaysToShortlist,
        avgDaysToHire,
        lowConversionJobs,
      },
      insights,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

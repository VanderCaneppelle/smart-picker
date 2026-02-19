import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse, jobBelongsToUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import type { ApplicationQuestion } from '@hunter/core';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/jobs/:id/duplicate - Duplicate a job (protected)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Find the original job and verify ownership
    const originalJob = await prisma.job.findFirst({
      where: { id, deleted_at: null },
    });

    if (!originalJob || !jobBelongsToUser(originalJob, user)) {
      return Response.json(
        { error: 'Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    // Generate new IDs for application questions
    const originalQuestions = originalJob.application_questions as unknown as ApplicationQuestion[];
    const applicationQuestions = (originalQuestions || []).map(
      (q: ApplicationQuestion) => ({
        ...q,
        id: uuidv4(),
      })
    );

    // Create the duplicate (owned by same user)
    const duplicatedJob = await prisma.job.create({
      data: {
        user_id: user.id,
        title: `${originalJob.title} (Copy)`,
        location: originalJob.location,
        employment_type: originalJob.employment_type,
        description: originalJob.description,
        salary_range: originalJob.salary_range,
        currency_code: originalJob.currency_code,
        calendly_link: originalJob.calendly_link,
        application_questions: applicationQuestions,
        interview_questions: originalJob.interview_questions,
        resume_weight: originalJob.resume_weight,
        answers_weight: originalJob.answers_weight,
        scoring_instructions: originalJob.scoring_instructions,
        status: 'active',
      },
      include: {
        _count: {
          select: { candidates: { where: { deleted_at: null } } },
        },
      },
    });

    return Response.json(duplicatedJob, { status: 201 });
  } catch (error) {
    console.error('Error duplicating job:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to duplicate job' },
      { status: 500 }
    );
  }
}

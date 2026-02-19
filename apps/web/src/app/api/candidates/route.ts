import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { triggerWorkerProcess } from '@/lib/worker';
import { CreateCandidateSchema, CandidateFiltersSchema } from '@hunter/core';
import type { ApplicationQuestion, ApplicationAnswer } from '@hunter/core';
import { Prisma } from '@prisma/client';
import { evaluateEliminatoryQuestions } from '@/lib/evaluate-eliminatory';

// GET /api/candidates - List all candidates (protected)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    
    const filters = CandidateFiltersSchema.safeParse({
      job_id: searchParams.get('job_id') || undefined,
      status: searchParams.get('status') || undefined,
      min_fit_score: searchParams.get('min_fit_score') || undefined,
      max_fit_score: searchParams.get('max_fit_score') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!filters.success) {
      return Response.json(
        { error: 'Bad Request', message: 'Invalid filters' },
        { status: 400 }
      );
    }

    const where: Prisma.CandidateWhereInput = {
      deleted_at: null,
      job: {
        user_id: user.id, // Multi-tenant: apenas candidatos das vagas do recrutador
        deleted_at: null,
      },
    };

    if (filters.data.job_id) {
      where.job_id = filters.data.job_id;
    }

    if (filters.data.status) {
      where.status = filters.data.status;
    }

    if (filters.data.min_fit_score !== undefined || filters.data.max_fit_score !== undefined) {
      where.fit_score = {};
      if (filters.data.min_fit_score !== undefined) {
        where.fit_score.gte = filters.data.min_fit_score;
      }
      if (filters.data.max_fit_score !== undefined) {
        where.fit_score.lte = filters.data.max_fit_score;
      }
    }

    if (filters.data.search) {
      where.OR = [
        { name: { contains: filters.data.search, mode: 'insensitive' } },
        { email: { contains: filters.data.search, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: [
          { fit_score: 'desc' },
          { created_at: 'desc' },
        ],
        include: {
          job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    return Response.json({ candidates, total });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

// POST /api/candidates - Create a new candidate (public - for job applications)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateCandidateSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { 
          error: 'Bad Request', 
          message: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    const job = await prisma.job.findFirst({
      where: { 
        id: validation.data.job_id, 
        deleted_at: null,
        status: 'active',
      },
    });

    if (!job) {
      return Response.json(
        { error: 'Not Found', message: 'Job not found or not accepting applications' },
        { status: 404 }
      );
    }

    // Check for duplicate application (same email for same job)
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        job_id: validation.data.job_id,
        email: validation.data.email,
        deleted_at: null,
      },
    });

    if (existingCandidate) {
      return Response.json(
        { error: 'Conflict', message: 'You have already applied for this position' },
        { status: 409 }
      );
    }

    const questions = (job.application_questions || []) as ApplicationQuestion[];
    const candidateAnswers = (validation.data.application_answers || []) as ApplicationAnswer[];

    const disqualificationFlags = evaluateEliminatoryQuestions(questions, candidateAnswers);

    const hasElimination = disqualificationFlags.some((f) => f.severity === 'eliminated');

    const candidate = await prisma.candidate.create({
      data: {
        job_id: validation.data.job_id,
        name: validation.data.name,
        email: validation.data.email,
        phone_number: validation.data.phone_number,
        linkedin_url: validation.data.linkedin_url || null,
        resume_url: validation.data.resume_url,
        application_answers: validation.data.application_answers,
        status: hasElimination ? 'rejected' : 'new',
        needs_scoring: !hasElimination,
        disqualification_flags: disqualificationFlags.length > 0 ? disqualificationFlags : [],
      },
    });

    if (!hasElimination) {
      triggerWorkerProcess(candidate.id);
    }

    return Response.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { CreateJobSchema, JobFiltersSchema } from '@hunter/core';
import { Prisma } from '@prisma/client';

// GET /api/jobs - List all jobs (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = JobFiltersSchema.safeParse({
      status: searchParams.get('status') || undefined,
      employment_type: searchParams.get('employment_type') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!filters.success) {
      return Response.json(
        { error: 'Bad Request', message: 'Invalid filters' },
        { status: 400 }
      );
    }

    const where: Prisma.JobWhereInput = {
      deleted_at: null,
    };

    if (filters.data.status) {
      where.status = filters.data.status;
    }

    if (filters.data.employment_type) {
      where.employment_type = filters.data.employment_type;
    }

    if (filters.data.search) {
      where.OR = [
        { title: { contains: filters.data.search, mode: 'insensitive' } },
        { description: { contains: filters.data.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { candidates: { where: { deleted_at: null } } },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return Response.json({ jobs, total });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job (protected)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = CreateJobSchema.safeParse(body);

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

    const job = await prisma.job.create({
      data: {
        title: validation.data.title,
        location: validation.data.location,
        employment_type: validation.data.employment_type,
        description: validation.data.description,
        salary_range: validation.data.salary_range,
        currency_code: validation.data.currency_code,
        calendly_link: validation.data.calendly_link || null,
        application_questions: validation.data.application_questions,
        interview_questions: validation.data.interview_questions,
        status: validation.data.status,
      },
      include: {
        _count: {
          select: { candidates: { where: { deleted_at: null } } },
        },
      },
    });

    return Response.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to create job' },
      { status: 500 }
    );
  }
}

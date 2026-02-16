import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { UpdateJobSchema } from '@hunter/core';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/:id - Get job details (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, deleted_at: null },
      include: {
        _count: {
          select: { candidates: { where: { deleted_at: null } } },
        },
      },
    });

    if (!job) {
      return Response.json(
        { error: 'Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    return Response.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/:id - Update job (protected)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const validation = UpdateJobSchema.safeParse(body);

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

    // Check if job exists
    const existingJob = await prisma.job.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingJob) {
      return Response.json(
        { error: 'Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    // Build update data - only include fields that are present
    const updateData: Record<string, unknown> = {};
    const data = validation.data;

    if (data.title !== undefined) updateData.title = data.title;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.employment_type !== undefined) updateData.employment_type = data.employment_type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.salary_range !== undefined) updateData.salary_range = data.salary_range;
    if (data.currency_code !== undefined) updateData.currency_code = data.currency_code;
    if (data.calendly_link !== undefined) updateData.calendly_link = data.calendly_link || null;
    if (data.application_questions !== undefined) updateData.application_questions = data.application_questions;
    if (data.interview_questions !== undefined) updateData.interview_questions = data.interview_questions;
    if (data.status !== undefined) updateData.status = data.status;

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { candidates: { where: { deleted_at: null } } },
        },
      },
    });

    return Response.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/:id - Soft delete job (protected)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Check if job exists
    const existingJob = await prisma.job.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingJob) {
      return Response.json(
        { error: 'Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.job.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return Response.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to delete job' },
      { status: 500 }
    );
  }
}

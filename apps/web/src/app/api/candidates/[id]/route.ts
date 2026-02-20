import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse, jobBelongsToUser } from '@/lib/auth';
import { UpdateCandidateSchema } from '@hunter/core';
import { triggerScheduleInterviewEmail, triggerRejectionEmail } from '@/lib/worker';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/candidates/:id - Get candidate details (protected)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const candidate = await prisma.candidate.findFirst({
      where: { id, deleted_at: null },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            employment_type: true,
            application_questions: true,
            user_id: true,
          },
        },
      },
    });

    if (!candidate || !jobBelongsToUser(candidate.job, user)) {
      return Response.json(
        { error: 'Not Found', message: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Remove user_id from response
    const { user_id: _, ...jobWithoutUserId } = candidate.job;
    return Response.json({ ...candidate, job: jobWithoutUserId });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}

// PATCH /api/candidates/:id - Update candidate (protected)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const validation = UpdateCandidateSchema.safeParse(body);

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

    // Check if candidate exists and belongs to user's job
    const existingCandidate = await prisma.candidate.findFirst({
      where: { id, deleted_at: null },
      include: { job: { select: { user_id: true } } },
    });

    if (!existingCandidate || !jobBelongsToUser(existingCandidate.job, user)) {
      return Response.json(
        { error: 'Not Found', message: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Build update data - only include fields that are present
    const updateData: Record<string, unknown> = {};
    const data = validation.data;

    if (data.status !== undefined) updateData.status = data.status;
    if (data.fit_score !== undefined) updateData.fit_score = data.fit_score;
    if (data.resume_rating !== undefined) updateData.resume_rating = data.resume_rating;
    if (data.answer_quality_rating !== undefined) updateData.answer_quality_rating = data.answer_quality_rating;
    if (data.resume_summary !== undefined) updateData.resume_summary = data.resume_summary;
    if (data.experience_level !== undefined) updateData.experience_level = data.experience_level;
    if (data.needs_scoring !== undefined) updateData.needs_scoring = data.needs_scoring;
    if (data.flagged_reason !== undefined) updateData.flagged_reason = data.flagged_reason;

    // Clear flagged_reason when moving away from flagged status
    if (data.status && data.status !== 'flagged' && existingCandidate.status === 'flagged') {
      updateData.flagged_reason = null;
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // When status changes to schedule_interview, send email with Calendly link
    if (data.status === 'schedule_interview') {
      triggerScheduleInterviewEmail(candidate.id);
    }
    // When status changes to rejected, send rejection email to candidate
    if (data.status === 'rejected') {
      triggerRejectionEmail(candidate.id);
    }

    return Response.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

// DELETE /api/candidates/:id - Soft delete candidate (protected)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Check if candidate exists and belongs to user's job
    const existingCandidate = await prisma.candidate.findFirst({
      where: { id, deleted_at: null },
      include: { job: { select: { user_id: true } } },
    });

    if (!existingCandidate || !jobBelongsToUser(existingCandidate.job, user)) {
      return Response.json(
        { error: 'Not Found', message: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.candidate.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return Response.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}

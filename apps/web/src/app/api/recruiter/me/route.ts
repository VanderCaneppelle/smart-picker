import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { z } from 'zod';

const UpdateRecruiterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  company: z.string().max(200).nullable().optional(),
  phone_number: z.string().max(50).nullable().optional(),
});

// GET /api/recruiter/me - Perfil do recrutador logado
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const recruiter = await prisma.recruiter.findUnique({
      where: { id: user.id },
    });

    if (!recruiter) {
      return Response.json(
        { error: 'Not Found', message: 'Recruiter profile not found' },
        { status: 404 }
      );
    }

    return Response.json(recruiter);
  } catch (error) {
    console.error('Error fetching recruiter:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/recruiter/me - Atualizar perfil do recrutador
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = UpdateRecruiterSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: 'Bad Request', message: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: { name?: string; company?: string | null; phone_number?: string | null } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;

    const recruiter = await prisma.recruiter.update({
      where: { id: user.id },
      data: updateData,
    });

    return Response.json(recruiter);
  } catch (error) {
    console.error('Error updating recruiter:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

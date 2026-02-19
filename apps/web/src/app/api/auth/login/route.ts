import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { LoginSchema } from '@hunter/core';

// POST /api/auth/login - Login with email and password
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Service Unavailable', message: 'Auth service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

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

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      return Response.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    // Ensure Recruiter exists (for legacy users migrated from Auth-only)
    const userId = data.user.id;
    const email = data.user.email!;
    await prisma.recruiter.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        company: null,
        phone_number: null,
      },
      update: {}, // Don't overwrite existing recruiter data
    });

    return Response.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to login' },
      { status: 500 }
    );
  }
}

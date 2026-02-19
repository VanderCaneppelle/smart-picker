import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { SignUpSchema } from '@hunter/core';

// POST /api/auth/signup - Create new user (recruiter) and Recruiter profile
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Service Unavailable', message: 'Auth service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = SignUpSchema.safeParse(body);

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

    const { email, password, name, company, phone_number } = validation.data;

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      },
    });

    if (error) {
      return Response.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    const userId = data.user!.id;

    // Create Recruiter profile (upsert in case of email confirmation flow - user may signup again)
    await prisma.recruiter.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        name,
        company: company || null,
        phone_number: phone_number || null,
      },
      update: {
        email,
        name,
        company: company || null,
        phone_number: phone_number || null,
      },
    });

    // If email confirmation is required, session may be null
    if (data.session) {
      return Response.json({
        user: {
          id: data.user!.id,
          email: data.user!.email,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        requires_confirmation: false,
      });
    }

    // Email confirmation required
    return Response.json({
      user: { id: data.user!.id, email: data.user!.email },
      requires_confirmation: true,
      message: 'Check your email to confirm your account',
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to create account' },
      { status: 500 }
    );
  }
}

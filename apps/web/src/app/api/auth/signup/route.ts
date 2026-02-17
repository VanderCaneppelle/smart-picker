import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SignUpSchema } from '@hunter/core';

// POST /api/auth/signup - Create new user (recruiter)
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

    const { email, password } = validation.data;

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

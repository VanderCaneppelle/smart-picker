import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const RefreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// POST /api/auth/refresh - Refresh access token
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Service Unavailable', message: 'Auth service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = RefreshSchema.safeParse(body);

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

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: validation.data.refresh_token,
    });

    if (error || !data.session) {
      return Response.json(
        { error: 'Unauthorized', message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    return Response.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  } catch (error) {
    console.error('Error during token refresh:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
    };
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json(
    { error: 'Unauthorized', message },
    { status: 401 }
  );
}

/** Check if a job belongs to the given user (for multi-tenant isolation) */
export function jobBelongsToUser(job: { user_id: string | null }, user: AuthUser): boolean {
  return job.user_id === user.id;
}

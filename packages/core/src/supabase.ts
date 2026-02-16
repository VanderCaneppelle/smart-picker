import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key)
export function createSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient {
  return createClient(url, anonKey);
}

// Server-side Supabase client (uses service role key)
export function createSupabaseAdmin(
  url: string,
  serviceRoleKey: string
): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Verify JWT token and get user
export async function verifyToken(
  supabaseAdmin: SupabaseClient,
  token: string
) {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

// GET /api/auth/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Error getting user info:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to get user info' },
      { status: 500 }
    );
  }
}

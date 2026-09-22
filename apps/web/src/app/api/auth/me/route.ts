import { NextRequest } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/auth';

// GET /api/auth/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    // Sem requireAccount de propósito: esta rota tem que responder inclusive para
    // quem está com senha provisória pendente, senão o app não descobre que precisa
    // mandar a pessoa trocar a senha.
    const ctx = await getAuthContext(request);

    if (!ctx) {
      return unauthorizedResponse();
    }

    return Response.json({
      user: {
        id: ctx.id,
        email: ctx.email,
        role: ctx.role,
        account_id: ctx.accountId,
        must_change_password: ctx.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to get user info' },
      { status: 500 }
    );
  }
}

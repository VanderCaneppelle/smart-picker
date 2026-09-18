import { NextRequest } from 'next/server';
import { requireAccount } from '@/lib/auth';
import {
  markInviteSent,
  removeMember,
  resetMemberPassword,
  TeamError,
} from '@/lib/team-service';
import { sendTeamInviteEmail, TeamInviteEmailError } from '@/lib/worker';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function handleError(error: unknown, fallback: string) {
  if (error instanceof TeamError) {
    return Response.json(
      { error: 'Team Error', code: error.code, message: error.message },
      { status: error.status }
    );
  }
  console.error(fallback, error);
  return Response.json(
    { error: 'Internal Server Error', message: fallback },
    { status: 500 }
  );
}

// DELETE /api/team/:id - Remove o usuário da conta e libera o assento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAccount(request, { ownerOnly: true });
  if (auth.response) return auth.response;

  try {
    const { id } = await params;

    // O dono não se remove pela tela de equipe: isso é cancelar a assinatura.
    if (id === auth.ctx.accountId) {
      return Response.json(
        {
          error: 'Bad Request',
          code: 'cannot_remove_owner',
          message: 'O dono da conta não pode ser removido aqui.',
        },
        { status: 400 }
      );
    }

    await removeMember(auth.ctx.accountId, id);
    return Response.json({ ok: true });
  } catch (error) {
    return handleError(error, 'Falha ao remover o usuário');
  }
}

// POST /api/team/:id - Gera uma senha provisória nova e reenvia o convite
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAccount(request, { ownerOnly: true });
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const { member, password } = await resetMemberPassword(auth.ctx.accountId, id);

    try {
      await sendTeamInviteEmail(member.id, password);
      await markInviteSent(member.id);
      return Response.json({
        member: { ...member, invite_email_sent_at: new Date().toISOString() },
        invite_email_sent: true,
      });
    } catch (err) {
      const message =
        err instanceof TeamInviteEmailError ? err.message : 'Falha ao enviar o convite.';
      console.error('[Team] Senha regerada mas e-mail não saiu:', message);
      return Response.json({ member, invite_email_sent: false, invite_error: message });
    }
  } catch (error) {
    return handleError(error, 'Falha ao gerar nova senha');
  }
}

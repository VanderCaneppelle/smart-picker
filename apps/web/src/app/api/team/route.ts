import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAccount } from '@/lib/auth';
import {
  createMember,
  listTeam,
  markInviteSent,
  TeamError,
} from '@/lib/team-service';
import { sendTeamInviteEmail, TeamInviteEmailError } from '@/lib/worker';
import { tradutorDeErros, traduzirZod } from '@/lib/erros';

const CreateMemberSchema = z.object({
  email: z.string().email('erros.emailInvalido').max(200),
  name: z.string().min(1, 'erros.informeNome').max(200),
});

// GET /api/team - Dono, membros e uso de assentos da conta
export async function GET(request: NextRequest) {
  const auth = await requireAccount(request, { ownerOnly: true });
  if (auth.response) return auth.response;

  try {
    return Response.json(await listTeam(auth.ctx.accountId));
  } catch (error) {
    if (error instanceof TeamError) {
      return Response.json(
        { error: 'Team Error', code: error.code, message: error.message },
        { status: error.status }
      );
    }
    console.error('Error listing team:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Falha ao carregar a equipe' },
      { status: 500 }
    );
  }
}

// POST /api/team - Cria um usuário na conta e manda a senha provisória por e-mail
export async function POST(request: NextRequest) {
  const t = await tradutorDeErros();
  const auth = await requireAccount(request, { ownerOnly: true });
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const validation = CreateMemberSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          error: 'Bad Request',
          message: 'Validation failed',
          details: traduzirZod(await tradutorDeErros(), validation.error.flatten()),
        },
        { status: 400 }
      );
    }

    const { member, password } = await createMember({
      accountId: auth.ctx.accountId,
      email: validation.data.email,
      name: validation.data.name,
    });

    // O usuário já existe neste ponto. O e-mail é o que falta, e ele pode falhar
    // sozinho: por isso a resposta é 201 com o aviso, e não 500. A tela mostra o
    // convite como não entregue e oferece gerar outra senha.
    try {
      await sendTeamInviteEmail(member.id, password);
      await markInviteSent(member.id);
      return Response.json({ member: { ...member, invite_email_sent_at: new Date().toISOString() }, invite_email_sent: true }, { status: 201 });
    } catch (err) {
      const message =
        err instanceof TeamInviteEmailError ? err.message : 'Falha ao enviar o convite.';
      console.error('[Team] Convite criado mas e-mail não saiu:', message);
      return Response.json(
        { member, invite_email_sent: false, invite_error: message },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof TeamError) {
      return Response.json(
        { error: 'Team Error', code: error.code, message: error.message },
        { status: error.status }
      );
    }
    console.error('Error creating team member:', error);
    return Response.json(
      { error: 'Internal Server Error', message: t('erros.criarUsuario') },
      { status: 500 }
    );
  }
}

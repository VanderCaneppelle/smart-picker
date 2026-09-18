import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAccount } from '@/lib/auth';

const ChangePasswordSchema = z.object({
  new_password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres').max(72),
  /** Obrigatória na troca voluntária. Dispensada na troca forçada do primeiro acesso. */
  current_password: z.string().min(1).max(72).optional(),
});

/**
 * POST /api/auth/change-password
 *
 * A troca acontece no servidor, com a service role, e não no cliente. O motivo é a
 * flag must_change_password: se o cliente chamasse supabase.auth.updateUser e depois
 * avisasse a API "pode desligar a flag", bastaria não fazer a primeira parte para
 * ficar com a senha provisória para sempre. Aqui trocar a senha e desligar a flag
 * são a mesma operação.
 */
export async function POST(request: NextRequest) {
  // allowPendingPassword: esta é justamente a rota que tira a pendência.
  const auth = await requireAccount(request, { allowPendingPassword: true });
  if (auth.response) return auth.response;

  const ctx = auth.ctx;

  try {
    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Service Unavailable', message: 'Auth service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = ChangePasswordSchema.safeParse(body);

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

    const { new_password, current_password } = validation.data;

    // Troca voluntária exige a senha atual. Na troca forçada não faz sentido pedir:
    // a pessoa acabou de digitar a provisória para entrar, e exigir de novo só faria
    // ela voltar ao e-mail para copiar.
    if (!ctx.mustChangePassword) {
      if (!current_password) {
        return Response.json(
          {
            error: 'Bad Request',
            code: 'current_password_required',
            message: 'Informe a senha atual.',
          },
          { status: 400 }
        );
      }

      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: ctx.email,
        password: current_password,
      });

      if (signInError) {
        return Response.json(
          { error: 'Unauthorized', code: 'wrong_password', message: 'Senha atual incorreta.' },
          { status: 401 }
        );
      }
    } else {
      // A troca forçada existe para a senha que foi por e-mail parar de valer. Repetir
      // a mesma senha passaria batido e deixaria a provisória viva numa caixa de entrada.
      const { error: sameError } = await supabaseAdmin.auth.signInWithPassword({
        email: ctx.email,
        password: new_password,
      });

      if (!sameError) {
        return Response.json(
          {
            error: 'Bad Request',
            code: 'password_reused',
            message: 'Escolha uma senha diferente da que veio no e-mail.',
          },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(ctx.id, {
      password: new_password,
    });

    if (error) {
      return Response.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    await prisma.recruiter.update({
      where: { id: ctx.id },
      data: { must_change_password: false },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Falha ao trocar a senha' },
      { status: 500 }
    );
  }
}

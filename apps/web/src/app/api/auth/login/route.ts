import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { LoginSchema } from '@hunter/core';
import { ensureTrialSubscription } from '@/lib/subscription-service';
import { isSeatBlocked } from '@/lib/auth';
import { tradutorDeErros } from '@/lib/erros';

// POST /api/auth/login - Login with email and password
export async function POST(request: NextRequest) {
  const t = await tradutorDeErros();
  try {
    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Service Unavailable', message: 'Auth service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

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

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      return Response.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    const userId = data.user.id;
    const email = data.user.email!;

    const recruiter = await prisma.recruiter.findUnique({ where: { id: userId } });

    // Membro da equipe: não tem assinatura própria, e pode estar fora dos assentos
    // se o dono tiver baixado de plano. Esse desvio precisa vir ANTES de qualquer
    // ensureTrialSubscription, senão cada pessoa convidada ganharia um trial de 30
    // dias e viraria uma conta separada, que é exatamente o contrário da feature.
    if (recruiter?.account_owner_id) {
      const bloqueado = await isSeatBlocked({
        id: userId,
        email,
        accountId: recruiter.account_owner_id,
        role: 'member',
        isOwner: false,
        mustChangePassword: recruiter.must_change_password,
      });

      if (bloqueado) {
        return Response.json(
          {
            error: 'Forbidden',
            code: 'seat_blocked',
            message:
              t('erros.limiteUsuarios'),
          },
          { status: 403 }
        );
      }

      return Response.json({
        user: {
          id: userId,
          email,
          role: 'member',
          account_id: recruiter.account_owner_id,
          must_change_password: recruiter.must_change_password,
        },
        locale: recruiter.locale ?? 'pt',
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });
    }

    if (!recruiter) {
      const byEmail = await prisma.recruiter.findUnique({ where: { email } });

      if (byEmail && byEmail.id !== userId) {
        console.log('[Login] Syncing recruiter ID from', byEmail.id, 'to Supabase Auth ID', userId);
        await prisma.recruiter.update({
          where: { email },
          data: { id: userId },
        });
      } else if (!byEmail) {
        await prisma.recruiter.create({
          data: {
            id: userId,
            email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            company: null,
            phone_number: null,
          },
        });
      }
    }

    await ensureTrialSubscription(userId);

    // O idioma acompanha a resposta do login para o cliente gravar o cookie na hora.
    // Sem isso a primeira tela depois de entrar nasceria no idioma padrão.
    const perfil = await prisma.recruiter.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    return Response.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'owner',
        account_id: data.user.id,
        must_change_password: false,
      },
      locale: perfil?.locale ?? 'pt',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to login' },
      { status: 500 }
    );
  }
}

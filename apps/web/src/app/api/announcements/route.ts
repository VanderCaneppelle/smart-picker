import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAccount } from '@/lib/auth';

/**
 * Avisos visíveis para o recrutador logado. Só devolve o que está ativo e dentro da
 * janela: o filtro de data roda no banco, não no cliente, para um aviso agendado ou
 * expirado nunca chegar ao navegador.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAccount(request);
  if (auth.response) return auth.response;

  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ starts_at: null }, { starts_at: { lte: now } }] },
        { OR: [{ ends_at: null }, { ends_at: { gte: now } }] },
      ],
    },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { id: true, title: true, body: true, level: true, dismissible: true },
  });

  return Response.json({ data: announcements });
}

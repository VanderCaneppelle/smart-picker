import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';

const LEVELS = ['info', 'success', 'warning'] as const;

export async function GET(request: NextRequest) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const announcements = await prisma.announcement.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return Response.json({ data: announcements });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Bad Request', message: 'JSON inválido' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const level = typeof body.level === 'string' && LEVELS.includes(body.level as never)
    ? body.level
    : 'info';

  if (!title || !text) {
    return Response.json(
      { error: 'Bad Request', message: 'Título e mensagem são obrigatórios.' },
      { status: 400 }
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: title.slice(0, 120),
      body: text.slice(0, 2000),
      level,
      active: body.active !== false,
      dismissible: body.dismissible !== false,
      starts_at: typeof body.starts_at === 'string' && body.starts_at ? new Date(body.starts_at) : null,
      ends_at: typeof body.ends_at === 'string' && body.ends_at ? new Date(body.ends_at) : null,
    },
  });

  return Response.json(announcement, { status: 201 });
}

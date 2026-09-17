import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { guardAdmin } from '@/lib/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Bad Request', message: 'JSON inválido' }, { status: 400 });
  }

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: 'Not Found', message: 'Aviso não encontrado' }, { status: 404 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
      ...(typeof body.title === 'string' ? { title: body.title.trim().slice(0, 120) } : {}),
      ...(typeof body.body === 'string' ? { body: body.body.trim().slice(0, 2000) } : {}),
      ...(typeof body.level === 'string' ? { level: body.level } : {}),
    },
  });

  return Response.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const guard = await guardAdmin(request);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await prisma.announcement.deleteMany({ where: { id } });

  return Response.json({ success: true });
}

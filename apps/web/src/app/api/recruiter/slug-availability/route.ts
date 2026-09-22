import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { validateSlug } from '@/lib/slug';
import { tradutorDeErros } from '@/lib/erros';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')?.toLowerCase().trim();

    if (!slug) {
      return Response.json(
        { error: 'Bad Request', message: 'slug query parameter is required' },
        { status: 400 }
      );
    }

    const validation = validateSlug(slug);
    if (!validation.valid) {
      const t = await tradutorDeErros();
      return Response.json({ available: false, reason: t(validation.errorKey!) });
    }

    const existing = await prisma.recruiter.findUnique({
      where: { public_slug: slug },
      select: { id: true },
    });

    return Response.json({ available: !existing });
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to check slug' },
      { status: 500 }
    );
  }
}

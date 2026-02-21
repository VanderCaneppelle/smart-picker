import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { z } from 'zod';
import { slugSchema } from '@/lib/slug';

const UpdateSettingsSchema = z.object({
  public_slug: slugSchema.optional(),
  public_page_enabled: z.boolean().optional(),

  public_display_name: z.string().max(200).nullable().optional(),
  public_headline: z.string().max(120).nullable().optional(),
  public_logo_url: z.string().url().nullable().optional(),
  public_linkedin_url: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .refine(
      (u) => !u || u.trim() === '' || (u.startsWith('http') && u.includes('linkedin.com')),
      'Informe um link válido do LinkedIn'
    ),
  brand_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida')
    .nullable()
    .optional(),

  email_sender_name: z.string().max(200).nullable().optional(),
  reply_to_email: z.string().email('E-mail inválido').nullable().optional(),
  email_signature: z.string().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    const recruiter = await prisma.recruiter.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        company: true,
        public_slug: true,
        public_page_enabled: true,
        public_display_name: true,
        public_headline: true,
        public_logo_url: true,
        public_linkedin_url: true,
        brand_color: true,
        email_sender_name: true,
        reply_to_email: true,
        email_signature: true,
      },
    });

    if (!recruiter) {
      return Response.json(
        { error: 'Not Found', message: 'Recruiter not found' },
        { status: 404 }
      );
    }

    return Response.json(recruiter);
  } catch (error) {
    console.error('Error fetching recruiter settings:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const validation = UpdateSettingsSchema.safeParse(body);
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

    const data = validation.data;

    if (data.public_slug) {
      const existing = await prisma.recruiter.findUnique({
        where: { public_slug: data.public_slug },
        select: { id: true },
      });
      if (existing && existing.id !== user.id) {
        return Response.json(
          { error: 'Conflict', message: 'Este slug já está em uso' },
          { status: 409 }
        );
      }
    }

    if (data.public_page_enabled === true) {
      const current = await prisma.recruiter.findUnique({
        where: { id: user.id },
        select: { public_slug: true },
      });
      const effectiveSlug = data.public_slug ?? current?.public_slug;
      if (!effectiveSlug) {
        return Response.json(
          {
            error: 'Bad Request',
            message: 'Defina um slug antes de ativar a página pública',
          },
          { status: 400 }
        );
      }
    }

    const updateData: {
      public_slug?: string;
      public_page_enabled?: boolean;
      public_display_name?: string | null;
      public_headline?: string | null;
      public_logo_url?: string | null;
      public_linkedin_url?: string | null;
      brand_color?: string | null;
      email_sender_name?: string | null;
      reply_to_email?: string | null;
      email_signature?: string | null;
    } = {};
    if (data.public_slug !== undefined) updateData.public_slug = data.public_slug;
    if (data.public_page_enabled !== undefined) updateData.public_page_enabled = data.public_page_enabled;
    if (data.public_display_name !== undefined) updateData.public_display_name = data.public_display_name;
    if (data.public_headline !== undefined) updateData.public_headline = data.public_headline;
    if (data.public_logo_url !== undefined) updateData.public_logo_url = data.public_logo_url;
    if (data.public_linkedin_url !== undefined) updateData.public_linkedin_url = data.public_linkedin_url;
    if (data.brand_color !== undefined) updateData.brand_color = data.brand_color;
    if (data.email_sender_name !== undefined) updateData.email_sender_name = data.email_sender_name;
    if (data.reply_to_email !== undefined) updateData.reply_to_email = data.reply_to_email;
    if (data.email_signature !== undefined) updateData.email_signature = data.email_signature;

    const recruiter = await prisma.recruiter.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        company: true,
        public_slug: true,
        public_page_enabled: true,
        public_display_name: true,
        public_headline: true,
        public_logo_url: true,
        public_linkedin_url: true,
        brand_color: true,
        email_sender_name: true,
        reply_to_email: true,
        email_signature: true,
      },
    });

    return Response.json(recruiter);
  } catch (error) {
    console.error('Error updating recruiter settings:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

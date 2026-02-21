import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// POST /api/upload - Upload file to Supabase Storage (public - for resume uploads)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Service Unavailable', message: 'Storage service not configured' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucketParam = (formData.get('bucket') as string) || 'resumes';

    // "logos" = mesma bucket "resumes", com path prefix "logos/" (evita criar bucket novo)
    const storageBucket = bucketParam === 'logos' ? 'resumes' : bucketParam;
    const pathPrefix = bucketParam === 'logos' ? 'logos/' : '';

    if (!file) {
      return Response.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on bucket
    const resumeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    const isImageBucket = bucketParam === 'logos';
    const allowedTypes = isImageBucket ? imageTypes : resumeTypes;

    if (!allowedTypes.includes(file.type)) {
      const msg = isImageBucket
        ? 'Tipo de arquivo inválido. Apenas imagens (PNG, JPG, WebP, SVG, GIF) são aceitas.'
        : 'Invalid file type. Only PDF and Word documents are allowed.';
      return Response.json(
        { error: 'Bad Request', message: msg },
        { status: 400 }
      );
    }

    // Validate file size (images: 2MB, docs: 10MB)
    const maxSize = isImageBucket ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const msg = isImageBucket
        ? 'Imagem muito grande. Máximo 2MB.'
        : 'File too large. Maximum size is 10MB.';
      return Response.json(
        { error: 'Bad Request', message: msg },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${pathPrefix}${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (bucket "resumes", path "logos/..." ou "...")
    const { error: uploadError } = await supabaseAdmin.storage
      .from(storageBucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return Response.json(
        { error: 'Internal Server Error', message: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(storageBucket)
      .getPublicUrl(filePath);

    return Response.json({
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { tradutorDeErros } from '@/lib/erros';
import { getAuthContext, unauthorizedResponse } from '@/lib/auth';
import { importPathPrefix } from '@/lib/import-storage';

/** Extensão derivada do tipo declarado, não do nome do arquivo. */
const EXTENSAO_POR_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// POST /api/upload - Upload file to Supabase Storage
//
// Continua público para o formulário de candidatura, que precisa aceitar anônimo. Com
// purpose=import a rota passa a exigir sessão: a importação não pode depender de um
// endpoint aberto, e o arquivo vai para imports/<accountId>/, que é o que prova, na
// hora de importar, que o currículo foi esta conta que subiu.
export async function POST(request: NextRequest) {
  const t = await tradutorDeErros();
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
    const isImport = formData.get('purpose') === 'import';

    let importPrefix: string | null = null;
    if (isImport) {
      const ctx = await getAuthContext(request);
      if (!ctx) return unauthorizedResponse();
      importPrefix = importPathPrefix(ctx.accountId);
    }

    // "logos" = mesma bucket "resumes", com path prefix "logos/" (evita criar bucket novo).
    // Importação é sempre currículo, então ignora o bucket pedido pelo cliente.
    const storageBucket = isImport || bucketParam === 'logos' ? 'resumes' : bucketParam;
    const pathPrefix = importPrefix ?? (bucketParam === 'logos' ? 'logos/' : '');

    if (!file) {
      return Response.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on bucket
    const resumeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    const isImageBucket = bucketParam === 'logos' && !isImport;
    const allowedTypes = isImageBucket ? imageTypes : resumeTypes;

    if (!allowedTypes.includes(file.type)) {
      const msg = isImageBucket
        ? t('erros.uploadTipo')
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
        ? t('erros.uploadTamanho')
        : 'File too large. Maximum size is 10MB.';
      return Response.json(
        { error: 'Bad Request', message: msg },
        { status: 400 }
      );
    }

    // Generate unique filename. Na importação a extensão vem do tipo declarado: o
    // worker escolhe o parser pelo final da URL, e currículo salvo sem extensão (ou com
    // extensão errada no nome) cairia em "formato não suportado" sem motivo.
    const fileExtension = isImport
      ? EXTENSAO_POR_MIME[file.type]
      : file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${pathPrefix}${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Hash do conteúdo, calculado no servidor. O navegador também calcula o dele, para
    // barrar arquivo repetido antes de gastar upload, mas quem manda é este: o do
    // cliente é palpite, e dedup e idempotência dependem do hash ser verdadeiro.
    const sha256 = isImport ? createHash('sha256').update(buffer).digest('hex') : null;

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
      /** Caminho dentro do bucket: é o que a importação manda de volta em /api/candidates/import. */
      storage_path: filePath,
      sha256,
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

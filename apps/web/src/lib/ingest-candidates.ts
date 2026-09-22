import { Prisma } from '@prisma/client';
import {
  IMPORT_ALLOWED_MIME_TYPES,
  MAX_IMPORT_FILE_BYTES,
  type IngestFile,
  type IngestRejection,
  type IngestResult,
  type IngestSource,
} from '@hunter/core';
import { prisma } from './db';
import { supabaseAdmin } from './supabase';
import { logCandidateEvent } from './candidate-history';
import { getSubscriptionByRecruiterId } from './subscription-service';
import {
  getImportLimits,
  needsSubscription,
  type PlanId,
  type SubscriptionInfo,
  type SubscriptionStatus,
} from './subscription';

/**
 * NÚCLEO da ingestão de currículos. Toda a regra vive aqui e cada porta de entrada é
 * um adaptador fino: hoje a tela da vaga, amanhã o currículo encaminhado para
 * vaga-<token>@vagas.rankea.ai, depois talvez uma API pública.
 *
 * Três restrições que existem por causa das portas futuras. Respeite mesmo que hoje
 * pareçam desnecessárias:
 *
 * 1. Este módulo NUNCA lê a sessão. Recebe accountId e jobId prontos, porque quem
 *    chega por e-mail não tem sessão, tem um token no endereço.
 * 2. Recebe arquivos que JÁ estão no Storage, nunca bytes nem File do navegador. Quem
 *    coloca o conteúdo lá é o adaptador (o navegador faz upload, o webhook baixa o
 *    anexo). A partir do arquivo no bucket, o caminho é idêntico.
 * 3. Devolve código, nunca texto de tela. A tela traduz para o idioma do recrutador; o
 *    adaptador de e-mail vai traduzir para o corpo de uma resposta automática.
 */

/** Bucket onde os currículos vivem, o mesmo do formulário público. */
const RESUMES_BUCKET = 'resumes';

/** Domínio inexistente de propósito: nada que saia para ele pode ser entregue. */
const PLACEHOLDER_EMAIL_DOMAIN = 'import.rankea.ai';

export type IngestErrorCode = 'job_not_found' | 'storage_unavailable';

/**
 * Falha que impede o lote inteiro, diferente da recusa de um arquivo. O adaptador
 * traduz para o status HTTP; o núcleo não conhece HTTP.
 */
export class IngestError extends Error {
  constructor(public readonly code: IngestErrorCode) {
    super(code);
    this.name = 'IngestError';
  }
}

export interface IngestParams {
  jobId: string;
  accountId: string;
  source: IngestSource;
  files: IngestFile[];
}

/**
 * Nome provisório do candidato: o nome do arquivo sem extensão. Vale até a IA extrair
 * o nome real do currículo (o worker só sobrescreve enquanto o valor ainda é este).
 */
function provisionalName(originalName: string): string {
  const withoutExtension = originalName.replace(/\.[^.]+$/, '').trim();
  return (withoutExtension || originalName).slice(0, 200);
}

/**
 * E-mail provisório, único por conteúdo e em domínio que não existe. Único de verdade
 * importa: a tela usa o e-mail para falar de duplicata, e dois provisórios iguais numa
 * mesma vaga confundiriam o recrutador.
 */
function provisionalEmail(sha256: string): string {
  return `importado-${sha256.slice(0, 12)}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

function reject(file: IngestFile, code: IngestRejection['code']): IngestRejection {
  return { sha256: file.sha256, original_name: file.original_name, code };
}

/** Primeiro instante do mês corrente, que é a janela do limite mensal. */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function ingestResumes(params: IngestParams): Promise<IngestResult> {
  const { jobId, accountId, source, files } = params;

  if (!supabaseAdmin) {
    throw new IngestError('storage_unavailable');
  }

  // A vaga pode estar em qualquer status. Quem importa é o recrutador, não o público:
  // a checagem de status 'active' do formulário de candidatura não se aplica aqui.
  const job = await prisma.job.findFirst({
    where: { id: jobId, deleted_at: null },
    select: { id: true, user_id: true },
  });

  if (!job || job.user_id !== accountId) {
    throw new IngestError('job_not_found');
  }

  const rejected: IngestRejection[] = [];

  // Sem assinatura válida nada é criado. Importar custa uma chamada de IA por arquivo,
  // e uma vaga aberta no trial vencido seguiria gerando custo para sempre.
  const subscription = await getSubscriptionByRecruiterId(accountId);
  const subscriptionInfo: SubscriptionInfo = {
    status: (subscription?.status as SubscriptionStatus) ?? 'trialing',
    plan: (subscription?.plan as PlanId | null) ?? null,
    trialEndsAt: subscription?.trial_ends_at?.toISOString() ?? null,
    currentPeriodEnd: null,
  };

  if (!subscription || needsSubscription(subscriptionInfo)) {
    return {
      created: [],
      rejected: files.map((f) => reject(f, 'subscription_required')),
      queued: 0,
    };
  }

  const limits = getImportLimits(subscriptionInfo);

  // Consultas em série, nunca Promise.all: a DATABASE_URL roda com pgbouncer e
  // connection_limit=1, então paralelizar aqui estoura o pool com P2024.
  const usedThisMonth = await prisma.candidate.count({
    where: {
      source: { in: ['import', 'email'] },
      created_at: { gte: startOfCurrentMonth() },
      deleted_at: null,
      job: { user_id: accountId },
    },
  });

  const incomingHashes = files.map((f) => f.sha256);
  const alreadyInJob = await prisma.candidate.findMany({
    where: {
      job_id: jobId,
      deleted_at: null,
      resume_sha256: { in: incomingHashes },
    },
    select: { resume_sha256: true },
  });
  const knownHashes = new Set(
    alreadyInJob.map((c) => c.resume_sha256).filter((h): h is string => h !== null)
  );

  const created: IngestResult['created'] = [];
  let remainingBatch = limits.perBatch;
  let remainingMonth = Math.max(0, limits.perMonth - usedThisMonth);

  // Série de propósito, pelo mesmo motivo do pgbouncer acima. Um lote de 200 leva
  // alguns segundos; um lote de 200 em paralelo não termina.
  for (const file of files) {
    if (!IMPORT_ALLOWED_MIME_TYPES.includes(file.mime_type as (typeof IMPORT_ALLOWED_MIME_TYPES)[number])) {
      rejected.push(reject(file, 'unsupported_type'));
      continue;
    }

    if (file.size_bytes > MAX_IMPORT_FILE_BYTES) {
      rejected.push(reject(file, 'too_large'));
      continue;
    }

    // Dedup e idempotência na mesma trava: cobre o arquivo repetido dentro do próprio
    // lote, o que já está na vaga, e a reentrega de um webhook de e-mail.
    if (knownHashes.has(file.sha256)) {
      rejected.push(reject(file, 'duplicate_file'));
      continue;
    }

    if (remainingBatch <= 0) {
      rejected.push(reject(file, 'batch_limit'));
      continue;
    }

    if (remainingMonth <= 0) {
      rejected.push(reject(file, 'monthly_limit'));
      continue;
    }

    const { data } = supabaseAdmin.storage.from(RESUMES_BUCKET).getPublicUrl(file.storage_path);

    try {
      const candidate = await prisma.candidate.create({
        data: {
          job_id: jobId,
          name: provisionalName(file.original_name),
          email: provisionalEmail(file.sha256),
          resume_url: data.publicUrl,
          application_answers: [],
          status: 'new',
          needs_scoring: true,
          source,
          resume_sha256: file.sha256,
          // Nunca preenchido na importação: não houve candidatura e não houve
          // consentimento. O recrutador é o controlador do currículo que importa.
          consent_given_at: null,
          consent_version: null,
        },
        select: { id: true },
      });

      knownHashes.add(file.sha256);
      remainingBatch -= 1;
      remainingMonth -= 1;
      created.push({ candidate_id: candidate.id, sha256: file.sha256 });

      await logCandidateEvent({
        candidateId: candidate.id,
        jobId,
        eventType: 'candidate_imported',
        toStatus: 'new',
        message: 'Currículo importado pelo recrutador',
        metadata: { source, original_name: file.original_name },
        createdBy: 'system',
      });
    } catch (error) {
      // P2002 é o índice único (job_id, resume_sha256) do banco batendo: outra
      // requisição criou este mesmo arquivo enquanto este lote rodava. É a mesma
      // duplicata, só descoberta tarde.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        knownHashes.add(file.sha256);
        rejected.push(reject(file, 'duplicate_file'));
        continue;
      }
      throw error;
    }
  }

  return { created, rejected, queued: created.length };
}

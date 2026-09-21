import { NextRequest } from 'next/server';
import { ImportCandidatesSchema } from '@hunter/core';
import { requireAccount } from '@/lib/auth';
import { ingestResumes, IngestError } from '@/lib/ingest-candidates';
import { importPathPrefix } from '@/lib/import-storage';
import { triggerJobQueueProcess } from '@/lib/worker';

/**
 * POST /api/candidates/import (autenticada)
 *
 * Adaptador da porta "tela da vaga": resolve sessão e conta, confere o dono da vaga e
 * entrega arquivos já gravados no bucket ao núcleo. Nenhuma regra de ingestão mora
 * aqui, porque a próxima porta (currículo encaminhado por e-mail) vai precisar das
 * mesmas regras sem ter sessão nenhuma.
 *
 * Lote parcialmente aceito não é erro: devolve 200 com a lista de recusados e o código
 * de cada recusa.
 */
export async function POST(request: NextRequest) {
  /**
   * Guardado fora do try porque o núcleo pode falhar no meio do lote, com parte dos
   * candidatos já criada. Sem disparar o worker no caminho de erro, esses candidatos
   * ficariam com needs_scoring = true e ninguém iria pontuá-los até o próximo lote
   * naquela vaga: falha barulhenta na tela, silenciosa no banco.
   */
  let jobIdParaDrenar: string | null = null;

  try {
    const auth = await requireAccount(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const validation = ImportCandidatesSchema.safeParse(body);

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

    const { job_id, files } = validation.data;
    jobIdParaDrenar = job_id;

    // O storage_path vem do cliente, então precisa ser provado. Sem isto, uma conta
    // poderia importar para a própria vaga o arquivo que outra conta subiu, só
    // adivinhando o caminho. O upload grava sob imports/<accountId>/, e é só isso que
    // esta rota aceita.
    const prefix = importPathPrefix(auth.ctx.accountId);
    const foraDaConta = files.filter((f) => !f.storage_path.startsWith(prefix));
    if (foraDaConta.length > 0) {
      return Response.json(
        {
          error: 'Bad Request',
          message: 'Arquivo fora do diretório de importação desta conta.',
        },
        { status: 400 }
      );
    }

    const result = await ingestResumes({
      jobId: job_id,
      accountId: auth.ctx.accountId,
      source: 'import',
      files,
    });

    // Lote inteiro barrado por assinatura é a única recusa que vira erro HTTP: não é um
    // arquivo com problema, é a conta sem direito de importar, e a tela precisa levar o
    // recrutador para o checkout em vez de listar 40 linhas vermelhas.
    const tudoSemAssinatura =
      result.created.length === 0 &&
      result.rejected.length > 0 &&
      result.rejected.every((r) => r.code === 'subscription_required');

    if (tudoSemAssinatura) {
      return Response.json(
        {
          error: 'Payment Required',
          message: 'É necessário ter assinatura ativa para importar currículos.',
          ...result,
        },
        { status: 402 }
      );
    }

    // Uma chamada só para a vaga inteira, depois de todos criados, e aguardada porque
    // em serverless a função pode ser encerrada antes de a requisição sair.
    if (result.queued > 0) {
      await triggerJobQueueProcess(job_id);
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof IngestError) {
      if (error.code === 'job_not_found') {
        return Response.json(
          { error: 'Not Found', message: 'Job not found' },
          { status: 404 }
        );
      }
      return Response.json(
        { error: 'Service Unavailable', message: 'Storage service not configured' },
        { status: 503 }
      );
    }

    console.error('Error importing candidates:', error);

    if (jobIdParaDrenar) {
      await triggerJobQueueProcess(jobIdParaDrenar).catch(() => {});
    }

    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to import candidates' },
      { status: 500 }
    );
  }
}

import { prisma } from '../lib/db.js';
import { processCandidate } from './processQueue.js';

/**
 * Quantos candidatos são pontuados ao mesmo tempo. Três é o teto combinado: cada um é
 * uma chamada à OpenAI mais uma escrita no Postgres, e subir isso só troca tempo de
 * espera por risco de rate limit e de pool esgotado.
 */
const CONCORRENCIA = 3;

/** Teto por drenagem, para uma fila gigante não virar um processo de horas sem fim. */
const MAX_POR_DRENAGEM = 500;

/**
 * Vagas sendo drenadas agora. O gatilho chega por HTTP e pode chegar duas vezes (o
 * recrutador importa dois lotes seguidos, ou a rede reentrega). Sem esta trava, os dois
 * drenos pegariam a mesma lista e pagariam duas vezes pela mesma pontuação.
 *
 * Em memória de propósito: o worker é um processo só no Railway. Se ele reiniciar no
 * meio, o lock some junto e a fila é reprocessada, que é o comportamento certo, porque
 * quem ficou com needs_scoring = true nunca foi pontuado.
 */
const drenando = new Set<string>();

export interface DrenagemResult {
  jobId: string;
  processados: number;
  falhas: number;
}

/**
 * Pontua todos os candidatos pendentes de UMA vaga.
 *
 * Sempre com skipEmails: esta fila existe por causa da importação, e candidato
 * importado não recebe e-mail automático. Quem chega pelo formulário continua no
 * caminho de sempre, o /process por candidato.
 */
export async function drenarFilaDaVaga(jobId: string): Promise<DrenagemResult> {
  const pendentes = await prisma.candidate.findMany({
    where: { job_id: jobId, needs_scoring: true, deleted_at: null },
    select: { id: true },
    orderBy: { created_at: 'asc' },
    take: MAX_POR_DRENAGEM,
  });

  if (pendentes.length === 0) {
    console.log(`[job-queue] vaga ${jobId}: nada pendente.`);
    return { jobId, processados: 0, falhas: 0 };
  }

  console.log(`[job-queue] vaga ${jobId}: ${pendentes.length} candidatos na fila.`);

  const fila = [...pendentes];
  let processados = 0;
  let falhas = 0;

  // Pool simples: CONCORRENCIA consumidores puxando da mesma lista. Nada de
  // Promise.all sobre a lista inteira, que é justamente o que derruba o banco.
  const consumidor = async () => {
    for (;;) {
      const proximo = fila.shift();
      if (!proximo) return;

      const resultado = await processCandidate(proximo.id, { skipEmails: true });
      if (resultado.ok) {
        processados += 1;
        continue;
      }

      falhas += 1;
      console.error(`[job-queue] candidato ${proximo.id} falhou: ${resultado.error}`);

      // Tira da fila mesmo em falha. Sem isto, um currículo que sempre quebra seria
      // repescado em toda drenagem daquela vaga, gastando IA para sempre. O recrutador
      // ainda pode pedir o recálculo manual desse candidato.
      await prisma.candidate
        .update({ where: { id: proximo.id }, data: { needs_scoring: false, needs_review: true } })
        .catch((err) => console.error(`[job-queue] não consegui desmarcar ${proximo.id}:`, err));
    }
  };

  await Promise.all(Array.from({ length: CONCORRENCIA }, consumidor));

  console.log(
    `[job-queue] vaga ${jobId}: ${processados} pontuados, ${falhas} falhas.`
  );

  return { jobId, processados, falhas };
}

/**
 * Entrada usada pelo endpoint HTTP: garante uma drenagem por vaga de cada vez e devolve
 * na hora, porque quem chama é uma função serverless com poucos segundos de vida.
 */
export function agendarDrenagem(jobId: string): { agendada: boolean } {
  if (drenando.has(jobId)) {
    console.log(`[job-queue] vaga ${jobId} já está sendo drenada, ignorando gatilho.`);
    return { agendada: false };
  }

  drenando.add(jobId);

  // Roda solta de propósito: o HTTP já respondeu. Toda falha é registrada aqui, porque
  // não há ninguém do outro lado para receber o erro.
  void drenarFilaDaVaga(jobId)
    .catch((err) => console.error(`[job-queue] drenagem da vaga ${jobId} falhou:`, err))
    .finally(() => {
      drenando.delete(jobId);
    });

  return { agendada: true };
}

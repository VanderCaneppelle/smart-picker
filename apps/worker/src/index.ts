import 'dotenv/config';
import http from 'node:http';
import { processCandidate } from './jobs/processQueue.js';
import { agendarDrenagem } from './jobs/processJobQueue.js';
import { sendScheduleInterviewEmail, sendRejectionEmail } from './jobs/sendEmails.js';
import { varrerTrials } from './jobs/trialLifecycle.js';
import { sendTeamInviteEmail } from './lib/teamEmails.js';
import { prisma } from './lib/db.js';
import { logCandidateEvent } from './lib/candidateHistory.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const WORKER_SECRET = process.env.WORKER_SECRET;

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Process candidate (event-driven)
  if (req.method === 'POST' && req.url === '/process') {
    if (!WORKER_SECRET) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'WORKER_SECRET not configured' }));
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== WORKER_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const candidateId = typeof body.candidateId === 'string' ? body.candidateId : null;
      const skipEmails = body.skipEmails === true;

      if (!candidateId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'candidateId is required' }));
        return;
      }

      const result = await processCandidate(candidateId, { skipEmails });

      if (result.ok) {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: result.error }));
      }
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }));
    }
    return;
  }

  // Drena a fila de pontuação de uma vaga inteira (importação em lote).
  //
  // Responde na hora e processa depois, de propósito: drenar 50 currículos leva minutos,
  // e quem chama é uma função serverless que desiste em 12 segundos. Se este endpoint
  // esperasse o fim, o gatilho estouraria por timeout e a mesma fila seria drenada de
  // novo a cada retentativa, pagando IA em dobro.
  if (req.method === 'POST' && req.url === '/process-job-queue') {
    if (!WORKER_SECRET) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'WORKER_SECRET not configured' }));
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== WORKER_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const jobId = typeof body.jobId === 'string' ? body.jobId : null;

      if (!jobId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'jobId is required' }));
        return;
      }

      const { agendada } = agendarDrenagem(jobId);

      res.writeHead(202);
      res.end(JSON.stringify({ ok: true, agendada }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }));
    }
    return;
  }

  // Send "schedule interview" email to candidate (Calendly link from job)
  if (req.method === 'POST' && req.url === '/send-schedule-interview') {
    if (!WORKER_SECRET) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'WORKER_SECRET not configured' }));
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== WORKER_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const candidateId = typeof body.candidateId === 'string' ? body.candidateId : null;

      if (!candidateId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'candidateId is required' }));
        return;
      }

      const candidate = await prisma.candidate.findFirst({
        where: { id: candidateId, deleted_at: null },
        include: {
          job: {
            include: {
              recruiter: { include: { emailPersonalization: true } },
            },
          },
        },
      });

      if (!candidate) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Candidate not found' }));
        return;
      }

      const personalization = candidate.job.recruiter?.emailPersonalization ?? null;
      await sendScheduleInterviewEmail(
        { id: candidate.id, name: candidate.name, email: candidate.email },
        candidate.job,
        personalization,
      );

      await prisma.candidate.update({
        where: { id: candidateId },
        data: { schedule_interview_email_sent_at: new Date() },
      });

      await logCandidateEvent({
        candidateId: candidate.id,
        jobId: candidate.job_id,
        eventType: 'email_sent_interview',
        message: 'E-mail de entrevista enviado',
        metadata: { provider: 'resend' },
        createdBy: 'system',
      });

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Error sending schedule interview email:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }));
    }
    return;
  }

  // Send rejection email to candidate when status is set to rejected
  if (req.method === 'POST' && req.url === '/send-rejection-email') {
    if (!WORKER_SECRET) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'WORKER_SECRET not configured' }));
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== WORKER_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const candidateId = typeof body.candidateId === 'string' ? body.candidateId : null;

      if (!candidateId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'candidateId is required' }));
        return;
      }

      const candidate = await prisma.candidate.findFirst({
        where: { id: candidateId, deleted_at: null },
        include: {
          job: {
            include: {
              recruiter: { include: { emailPersonalization: true } },
            },
          },
        },
      });

      if (!candidate) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Candidate not found' }));
        return;
      }

      const personalization = candidate.job.recruiter?.emailPersonalization ?? null;
      await sendRejectionEmail(
        { id: candidate.id, name: candidate.name, email: candidate.email },
        candidate.job,
        personalization,
      );

      await logCandidateEvent({
        candidateId: candidate.id,
        jobId: candidate.job_id,
        eventType: 'email_sent_rejection',
        message: 'E-mail de rejeição enviado',
        metadata: { provider: 'resend' },
        createdBy: 'system',
      });

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Error sending rejection email:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }));
    }
    return;
  }

  // Convite de equipe: manda a senha provisória para o novo usuário.
  //
  // Diferente dos outros endpoints, este responde SÍNCRONO e com erro de verdade.
  // A senha só existe nesta requisição, então falha silenciosa aqui deixaria um
  // usuário criado que ninguém consegue acessar. Quem chama (a API web) depende
  // desta resposta para decidir se marca o convite como entregue.
  if (req.method === 'POST' && req.url === '/send-team-invite') {
    if (!WORKER_SECRET) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'WORKER_SECRET not configured' }));
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== WORKER_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const memberId = typeof body.memberId === 'string' ? body.memberId : null;
      const password = typeof body.password === 'string' ? body.password : null;

      if (!memberId || !password) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'memberId and password are required' }));
        return;
      }

      const member = await prisma.recruiter.findUnique({
        where: { id: memberId },
        select: {
          email: true,
          name: true,
          locale: true,
          account_owner_id: true,
        },
      });

      if (!member || !member.account_owner_id) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Member not found' }));
        return;
      }

      const owner = await prisma.recruiter.findUnique({
        where: { id: member.account_owner_id },
        select: { name: true, company: true },
      });

      await sendTeamInviteEmail({
        memberName: member.name,
        memberEmail: member.email,
        ownerName: owner?.name ?? 'Rankea',
        companyName: owner?.company ?? null,
        password,
        appUrl: process.env.APP_URL || 'https://www.rankea.ai',
        locale: member.locale === 'en' ? 'en' : 'pt',
      });

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Error sending team invite email:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }));
    }
    return;
  }

  // Varredura manual dos lembretes de trial. Existe para testar sem esperar o
  // agendador, e para reprocessar caso o worker fique fora do ar.
  if (req.method === 'POST' && req.url === '/trial-sweep') {
    if (!WORKER_SECRET || req.headers['x-worker-secret'] !== WORKER_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const body = await parseBody(req);
      const resultado = await varrerTrials({
        ignorarHorario: body.ignorarHorario === true,
        simular: body.simular === true,
      });
      res.writeHead(200);
      res.end(JSON.stringify(resultado));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro na varredura' }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const INTERVALO_VARREDURA_MS = 60 * 60 * 1000; // de hora em hora

server.listen(PORT, () => {
  console.log(`Worker listening on port ${PORT} (event-driven)`);

  // Agendador simples em vez de cron: o worker já é um processo longo no Railway,
  // então não vale uma dependência a mais. A varredura decide sozinha se está no
  // horário de envio, e a UNIQUE em lifecycle_emails impede repetição.
  const rodar = () => {
    varrerTrials()
      .then((r) => {
        if (!r.executou) return;
        const total = r.enviados.trial_d7 + r.enviados.trial_d1 + r.enviados.trial_expired;
        if (total > 0) console.log('[trialLifecycle] varredura enviou:', r.enviados);
      })
      .catch((err) => console.error('[trialLifecycle] varredura falhou:', err));
  };

  // Espera um pouco no boot para não competir com o resto da inicialização.
  setTimeout(rodar, 30_000);
  setInterval(rodar, INTERVALO_VARREDURA_MS);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  server.close(() => process.exit(0));
});

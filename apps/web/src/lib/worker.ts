const WORKER_TRIGGER_TIMEOUT_MS = 12_000;

export interface TriggerProcessOptions {
  /** When true, worker only recalculates score and does not send any emails (e.g. for "recalcular nota"). */
  skipEmails?: boolean;
}

/**
 * Triggers the worker to process a candidate (event-driven).
 * Returns a Promise so the caller can await and ensure the request is sent (important in serverless).
 */
export function triggerWorkerProcess(candidateId: string, options?: TriggerProcessOptions): Promise<void> {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping process trigger.');
    return Promise.resolve();
  }

  const url = `${workerUrl.replace(/\/$/, '')}/process`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WORKER_TRIGGER_TIMEOUT_MS);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify({ candidateId, skipEmails: options?.skipEmails === true }),
    signal: controller.signal,
  })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[Worker] Process trigger failed: ${res.status} ${body}`);
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err.name !== 'AbortError') {
        console.error('[Worker] Failed to trigger process:', err);
      }
    });
}

/**
 * Triggers the worker to send "schedule interview" email to the candidate
 * (includes Calendly link from the job). Fire-and-forget.
 */
export function triggerScheduleInterviewEmail(candidateId: string): void {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping schedule interview email.');
    return;
  }

  const url = `${workerUrl.replace(/\/$/, '')}/send-schedule-interview`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify({ candidateId }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[Worker] Schedule interview email trigger failed: ${res.status} ${body}`);
      }
    })
    .catch((err) => {
      console.error('[Worker] Failed to send schedule interview email:', err);
    });
}

/**
 * Triggers the worker to send rejection email to the candidate.
 * Fire-and-forget.
 */
export function triggerRejectionEmail(candidateId: string): void {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping rejection email.');
    return;
  }

  const url = `${workerUrl.replace(/\/$/, '')}/send-rejection-email`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify({ candidateId }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[Worker] Rejection email trigger failed: ${res.status} ${body}`);
      }
    })
    .catch((err) => {
      console.error('[Worker] Failed to send rejection email:', err);
    });
}

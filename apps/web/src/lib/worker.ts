const WORKER_TRIGGER_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

function getWorkerConfig() {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;
  if (!workerUrl || !workerSecret) return null;
  return { workerUrl: workerUrl.replace(/\/$/, ''), workerSecret };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout + automatic retry on network errors.
 * Retries up to MAX_RETRIES times with RETRY_DELAY_MS between attempts.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  label: string
): Promise<void> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WORKER_TRIGGER_TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[Worker] ${label} failed: ${res.status} ${body}`);
      }
      return;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const isLastAttempt = attempt === MAX_RETRIES;

      if (isLastAttempt) {
        if (!isAbort) {
          console.error(`[Worker] ${label} failed after ${MAX_RETRIES + 1} attempts:`, err);
        } else {
          console.error(`[Worker] ${label} timed out after ${MAX_RETRIES + 1} attempts.`);
        }
        return;
      }

      const retryIn = RETRY_DELAY_MS * (attempt + 1);
      console.warn(`[Worker] ${label} attempt ${attempt + 1} failed, retrying in ${retryIn}ms...`);
      await wait(retryIn);
    }
  }
}

export interface TriggerProcessOptions {
  /** When true, worker only recalculates score and does not send any emails (e.g. for "recalcular nota"). */
  skipEmails?: boolean;
}

/**
 * Triggers the worker to process a candidate (event-driven).
 * Returns a Promise so the caller can await and ensure the request is sent (important in serverless).
 */
export function triggerWorkerProcess(candidateId: string, options?: TriggerProcessOptions): Promise<void> {
  const config = getWorkerConfig();
  if (!config) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping process trigger.');
    return Promise.resolve();
  }

  return fetchWithRetry(
    `${config.workerUrl}/process`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.workerSecret}`,
      },
      body: JSON.stringify({ candidateId, skipEmails: options?.skipEmails === true }),
    },
    `Process trigger (candidate ${candidateId})`
  );
}

/**
 * Triggers the worker to send "schedule interview" email to the candidate.
 * Returns a Promise so the caller can await.
 */
export function triggerScheduleInterviewEmail(candidateId: string): Promise<void> {
  const config = getWorkerConfig();
  if (!config) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping schedule interview email.');
    return Promise.resolve();
  }

  return fetchWithRetry(
    `${config.workerUrl}/send-schedule-interview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.workerSecret}`,
      },
      body: JSON.stringify({ candidateId }),
    },
    `Schedule interview email (candidate ${candidateId})`
  );
}

/**
 * Triggers the worker to send rejection email to the candidate.
 * Returns a Promise so the caller can await.
 */
export function triggerRejectionEmail(candidateId: string): Promise<void> {
  const config = getWorkerConfig();
  if (!config) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping rejection email.');
    return Promise.resolve();
  }

  return fetchWithRetry(
    `${config.workerUrl}/send-rejection-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.workerSecret}`,
      },
      body: JSON.stringify({ candidateId }),
    },
    `Rejection email (candidate ${candidateId})`
  );
}

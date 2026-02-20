/**
 * Triggers the worker to process a candidate (event-driven).
 * Fire-and-forget - does not block the response.
 */
export function triggerWorkerProcess(candidateId: string): void {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    console.warn('[Worker] WORKER_URL or WORKER_SECRET not configured. Skipping process trigger.');
    return;
  }

  const url = `${workerUrl.replace(/\/$/, '')}/process`;
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
        console.error(`[Worker] Process trigger failed: ${res.status} ${body}`);
      }
    })
    .catch((err) => {
      console.error('[Worker] Failed to trigger process:', err);
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

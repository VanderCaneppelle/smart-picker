/**
 * Triggers the worker to process a candidate (event-driven).
 * Fire-and-forget - does not block the response.
 */
export function triggerWorkerProcess(candidateId: string): void {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    return; // Worker not configured - candidate will stay in needs_scoring
  }

  const url = `${workerUrl.replace(/\/$/, '')}/process`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify({ candidateId }),
  }).catch((err) => {
    console.error('[Worker] Failed to trigger process:', err);
  });
}

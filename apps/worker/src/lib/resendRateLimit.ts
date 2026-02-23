/**
 * Rate limiter for Resend API: max 2 requests per second (sliding window).
 * Use this for all resend.emails.send() calls to avoid 429 Too Many Requests.
 */

const MAX_REQUESTS_PER_SECOND = 2;
const WINDOW_MS = 1000;

const recentSendTimestamps: number[] = [];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits until we're under the rate limit, then runs the send.
 * Call this instead of resend.emails.send() so bulk actions stay under 2 req/s.
 */
export async function withResendRateLimit<T>(send: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Keep only timestamps inside the current window
  while (recentSendTimestamps.length > 0 && recentSendTimestamps[0]! <= windowStart) {
    recentSendTimestamps.shift();
  }

  if (recentSendTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestInWindow = recentSendTimestamps[0]!;
    const waitMs = oldestInWindow + WINDOW_MS - Date.now();
    if (waitMs > 0) {
      console.log(`[Resend] Rate limit: waiting ${waitMs}ms before next send (max ${MAX_REQUESTS_PER_SECOND}/s).`);
      await wait(waitMs);
    }
    // After waiting, drop expired timestamps again
    const afterWait = Date.now();
    while (recentSendTimestamps.length > 0 && recentSendTimestamps[0]! <= afterWait - WINDOW_MS) {
      recentSendTimestamps.shift();
    }
  }

  recentSendTimestamps.push(Date.now());
  return send();
}

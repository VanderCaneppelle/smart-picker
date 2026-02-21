import { appendFileSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const root = cwd.endsWith(join('apps', 'worker')) ? join(cwd, '..', '..') : cwd;
const LOG_PATH = join(root, '.cursor', 'debug.log');

export function debugLog(payload: Record<string, unknown>): void {
  try {
    appendFileSync(LOG_PATH, JSON.stringify({ ...payload, timestamp: Date.now() }) + '\n');
  } catch {
    // ignore
  }
}

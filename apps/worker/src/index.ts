import { processQueue } from './jobs/processQueue.js';

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '30000', 10); // 30 seconds default

console.log('Worker starting...');
console.log(`Poll interval: ${POLL_INTERVAL_MS}ms`);

async function main() {
  // Initial run
  await runProcessing();

  // Set up polling interval
  setInterval(runProcessing, POLL_INTERVAL_MS);
}

async function runProcessing() {
  try {
    console.log(`[${new Date().toISOString()}] Starting processing cycle...`);
    await processQueue();
    console.log(`[${new Date().toISOString()}] Processing cycle complete.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in processing cycle:`, error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

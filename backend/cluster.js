/**
 * Cluster Mode — Multi-process API server using Node.js cluster module.
 *
 * Forks one API server process per CPU core (configurable via CLUSTER_WORKERS).
 * All workers share the same port via the OS kernel's SO_REUSEPORT.
 *
 * Usage:
 *   node cluster.js
 *
 * For full horizontal scaling:
 *   node cluster.js              # Multi-process API server
 *   node worker.js               # Separate compile worker(s)
 *
 * Set WORKER_ONLY=true on cluster.js to disable embedded compile workers
 * (they should run as separate processes via worker.js).
 *
 * Environment variables:
 *   CLUSTER_WORKERS — Number of worker processes (default: CPU count, max 4)
 *   WORKER_ONLY — Set to 'true' to disable embedded compile workers in the API server
 */

const cluster = require('cluster');
const os = require('os');

const numWorkers = Math.min(
  Number(process.env.CLUSTER_WORKERS || os.cpus().length),
  4  // Cap at 4 to avoid overwhelming single-server deployments
);

if (cluster.isPrimary) {
  console.log(`[cluster] Primary ${process.pid} starting ${numWorkers} worker(s)`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[cluster] Worker ${worker.process.pid} exited (code=${code}, signal=${signal})`);
    // Restart crashed workers
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log('[cluster] Restarting worker...');
      setTimeout(() => cluster.fork(), 1000);
    }
  });

  // Graceful shutdown: signal all workers
  process.on('SIGTERM', () => {
    console.log('[cluster] SIGTERM received, shutting down workers');
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill('SIGTERM');
    }
  });

  process.on('SIGINT', () => {
    console.log('[cluster] SIGINT received, shutting down workers');
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill('SIGINT');
    }
  });
} else {
  // Worker process — run the Express server
  require('./index.js');
}

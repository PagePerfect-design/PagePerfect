/**
 * Structured Logger — pino-based logging for PagePerfect backend.
 *
 * Replaces ad-hoc console.log/error/warn with structured JSON logging.
 * In production, outputs newline-delimited JSON (machine-parseable).
 * In development, uses pino-pretty-compatible formatting.
 *
 * Usage:
 *   const log = require('./logger');
 *   log.info({ jobId: '123' }, 'Compile started');
 *   log.child({ module: 'stripe' }).error({ err }, 'Webhook failed');
 */

const pino = require('pino');

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  // Redact sensitive fields that might leak into structured logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'stripe_secret',
      'password',
      'token',
    ],
    censor: '[REDACTED]',
  },
  // Consistent timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Base fields on every log line
  base: { service: 'pageperfect-api' },
  // Serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

module.exports = logger;

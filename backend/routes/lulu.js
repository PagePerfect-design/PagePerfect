const express = require('express');
const lulu = require('../lulu');
const log = require('../logger');

/**
 * Lulu Print-on-Demand API routes.
 */
module.exports = function luluRoutes() {
  const router = express.Router();

  router.get('/api/lulu/status', (_req, res) => {
    res.json({
      configured: lulu.isConfigured(),
      baseUrl: lulu.getBaseUrl(),
      sandbox: process.env.LULU_SANDBOX === 'true',
    });
  });

  router.post('/api/lulu/cost-estimate', async (req, res) => {
    if (!lulu.isConfigured()) {
      return res.status(501).json({ error: 'Lulu API not configured. Set LULU_CLIENT_KEY and LULU_CLIENT_SECRET.' });
    }
    try {
      const { trimSize, color, binding, paper, finish, pageCount, quantity, shippingAddress, shippingLevel } = req.body;
      const podPackageId = lulu.buildPodPackageId({ trimSize, color, binding, paper, finish });
      const result = await lulu.calculateCost({
        podPackageId,
        pageCount,
        quantity: quantity || 1,
        shippingAddress,
        shippingLevel: shippingLevel || 'MAIL',
      });
      res.json({ podPackageId, ...result });
    } catch (err) {
      log.error({ module: 'lulu/cost-estimate', err: err.message }, 'Cost estimate failed');
      res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
    }
  });

  router.post('/api/lulu/print-job', async (req, res) => {
    if (!lulu.isConfigured()) {
      return res.status(501).json({ error: 'Lulu API not configured.' });
    }
    try {
      const result = await lulu.createPrintJob(req.body);
      res.json(result);
    } catch (err) {
      log.error({ module: 'lulu/print-job', err: err.message }, 'Create print job failed');
      res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
    }
  });

  router.get('/api/lulu/print-job/:id', async (req, res) => {
    if (!lulu.isConfigured()) {
      return res.status(501).json({ error: 'Lulu API not configured.' });
    }
    try {
      const result = await lulu.getPrintJob(req.params.id);
      res.json(result);
    } catch (err) {
      log.error({ module: 'lulu/print-job', err: err.message }, 'Get print job failed');
      res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
    }
  });

  router.post('/api/lulu/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['lulu-hmac-sha256'];
    if (!lulu.verifyWebhook(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    const event = JSON.parse(req.body.toString());
    log.info({ module: 'lulu/webhook', jobId: event.id, status: event.status?.name || 'unknown' }, 'Print job status update');
    // TODO: Update order status in database
    res.json({ received: true });
  });

  return router;
};

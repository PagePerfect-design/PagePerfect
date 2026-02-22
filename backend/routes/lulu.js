const express = require('express');
const lulu = require('../lulu');
const log = require('../logger');

/**
 * Lulu Print-on-Demand API routes.
 * @param {object} ctx — shared context from index.js
 */
module.exports = function luluRoutes(ctx) {
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

  // ── Lulu Webhook — print job status updates ──
  // Lulu sends POST with HMAC-SHA256 signature. Event payload contains:
  //   { id, status: { name, message }, line_items, ... }
  // Status names: CREATED, UNPAID, PAYMENT_IN_PROGRESS, PRODUCTION_READY,
  //   PRODUCTION_DELAYED, IN_PRODUCTION, SHIPPED, REJECTED, CANCELLED, ERROR
  router.post('/api/lulu/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['lulu-hmac-sha256'];
    if (!lulu.verifyWebhook(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString());
    const jobId = String(event.id || '');
    const statusName = event.status?.name || 'unknown';
    const statusMessage = event.status?.message || '';

    log.info({ module: 'lulu/webhook', jobId, status: statusName }, 'Print job status update');

    // Persist status to PocketBase print_orders collection
    if (ctx.isPocketBaseConfigured && jobId) {
      try {
        // Look for existing record by lulu_job_id
        const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
        const filter = encodeURIComponent(`lulu_job_id='${safeJobId}'`);
        const listResp = await ctx.pbFetch(`/api/collections/print_orders/records?filter=${filter}`);

        if (listResp && listResp.ok) {
          const { items } = await listResp.json();
          const orderData = {
            lulu_job_id: safeJobId,
            status: statusName,
            status_message: statusMessage,
            raw_event: JSON.stringify(event),
          };

          // Extract tracking info from shipped events
          if (statusName === 'SHIPPED' && event.line_items) {
            const tracking = event.line_items
              .flatMap(li => li.tracking || [])
              .map(t => `${t.carrier || ''}: ${t.tracking_number || ''}`.trim())
              .filter(Boolean);
            if (tracking.length) orderData.tracking_info = tracking.join('; ');
          }

          if (items && items.length > 0) {
            // Update existing record
            const recordId = items[0].id;
            const patchResp = await ctx.pbFetch(`/api/collections/print_orders/records/${recordId}`, {
              method: 'PATCH',
              body: JSON.stringify(orderData),
            });
            if (patchResp && patchResp.ok) {
              log.info({ module: 'lulu/webhook', jobId, status: statusName }, 'Print order updated');
            } else {
              log.error({ module: 'lulu/webhook', status: patchResp?.status }, 'Failed to update print order');
            }
          } else {
            // Create new record
            const createResp = await ctx.pbFetch('/api/collections/print_orders/records', {
              method: 'POST',
              body: JSON.stringify(orderData),
            });
            if (createResp && createResp.ok) {
              log.info({ module: 'lulu/webhook', jobId, status: statusName }, 'Print order created');
            } else {
              log.error({ module: 'lulu/webhook', status: createResp?.status }, 'Failed to create print order');
            }
          }
        } else {
          log.warn({ module: 'lulu/webhook' }, 'print_orders collection not available — skipping DB update');
        }
      } catch (err) {
        // Non-fatal: webhook must always return 200 to prevent Lulu retries
        log.error({ module: 'lulu/webhook', err: err.message }, 'Failed to persist print order status');
      }
    }

    res.json({ received: true });
  });

  return router;
};

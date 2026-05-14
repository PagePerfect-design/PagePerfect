/**
 * lulu.test.js — webhook signature, PocketBase persistence, idempotent
 * status transitions, SHIPPED tracking extraction.
 *
 * Same approach as stripe.test.js — real Express app, mocked ctx, real HTTP
 * via Node's built-in fetch.
 *
 * Council seats consulted: #4 Security (HMAC verification), #15 Staff
 * engineer (test surface), #18 Database (PocketBase write shape).
 */

'use strict';

const express = require('express');
const crypto = require('crypto');
const luluRoutes = require('../routes/lulu');

jest.mock('../logger', () => ({
  info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, trace: () => {},
  child: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
}));

// We need to mock lulu.verifyWebhook to bypass the real LULU_CLIENT_SECRET dep,
// and also exercise both pass and fail paths deterministically.
const lulu = require('../lulu');
jest.spyOn(lulu, 'isConfigured').mockReturnValue(true);

const LULU_SECRET = 'lulu_test_secret_for_unit_test';

function sign(rawBody) {
  return crypto.createHmac('sha256', LULU_SECRET).update(rawBody).digest('hex');
}

function buildApp(ctxOverrides = {}) {
  const pbCalls = [];
  const ctx = {
    isPocketBaseConfigured: true,
    pbFetch: async (path, opts) => {
      pbCalls.push({ path, method: opts?.method || 'GET', body: opts?.body });
      // Default: empty filter list (no existing record)
      if (path.includes('?filter=')) {
        return { ok: true, status: 200, async json() { return { items: [] }; } };
      }
      return { ok: true, status: 200, async json() { return {}; } };
    },
    ...ctxOverrides,
  };
  const app = express();
  app.use(luluRoutes(ctx));
  return { app, ctx, pbCalls };
}

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

describe('POST /api/lulu/webhook — signature verification', () => {
  let server, url;

  beforeEach(() => {
    process.env.LULU_CLIENT_SECRET = LULU_SECRET;
  });

  afterEach(async () => {
    if (server) await new Promise((r) => server.close(r));
    server = null;
  });

  it('rejects requests with an invalid signature (401)', async () => {
    const { app } = buildApp();
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({ id: 'job_1', status: { name: 'CREATED' } });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: {
        'lulu-hmac-sha256': '00'.repeat(32),  // valid hex shape, wrong digest
        'content-type': 'application/json',
      },
    });

    expect(resp.status).toBe(401);
    const json = await resp.json();
    expect(json).toEqual({ error: 'Invalid webhook signature' });
  });

  it('rejects requests with a missing signature header (401)', async () => {
    const { app } = buildApp();
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({ id: 'job_2', status: { name: 'CREATED' } });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
    });

    expect(resp.status).toBe(401);
  });

  it('rejects requests with a malformed (non-hex) signature (401)', async () => {
    const { app } = buildApp();
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({ id: 'job_3', status: { name: 'CREATED' } });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: {
        'lulu-hmac-sha256': 'not-hex-at-all-bzzt',
        'content-type': 'application/json',
      },
    });

    expect(resp.status).toBe(401);
  });

  it('accepts requests with a valid signature (200)', async () => {
    const { app } = buildApp();
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({ id: 'job_valid', status: { name: 'CREATED', message: 'ok' } });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: {
        'lulu-hmac-sha256': sign(body),
        'content-type': 'application/json',
      },
    });

    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json).toEqual({ received: true });
  });
});

describe('POST /api/lulu/webhook — PocketBase persistence', () => {
  let server, url;

  beforeEach(() => {
    process.env.LULU_CLIENT_SECRET = LULU_SECRET;
  });

  afterEach(async () => {
    if (server) await new Promise((r) => server.close(r));
    server = null;
  });

  it('creates a print_orders record on first webhook for a job', async () => {
    const pbCalls = [];
    const { app } = buildApp({
      pbFetch: async (path, opts) => {
        pbCalls.push({ path, method: opts?.method || 'GET', body: opts?.body });
        if (path.includes('?filter=')) {
          return { ok: true, status: 200, async json() { return { items: [] }; } };
        }
        return { ok: true, status: 200, async json() { return { id: 'new_record' }; } };
      },
    });
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({
      id: 'job_create_001',
      status: { name: 'PRODUCTION_READY', message: 'ready' },
    });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'lulu-hmac-sha256': sign(body), 'content-type': 'application/json' },
    });

    expect(resp.status).toBe(200);
    const createCalls = pbCalls.filter(c => c.method === 'POST');
    expect(createCalls.length).toBe(1);
    expect(createCalls[0].path).toBe('/api/collections/print_orders/records');
    const created = JSON.parse(createCalls[0].body);
    expect(created.lulu_job_id).toBe('job_create_001');
    expect(created.status).toBe('PRODUCTION_READY');
    expect(created.status_message).toBe('ready');
  });

  it('updates the existing print_orders record on subsequent webhooks', async () => {
    const pbCalls = [];
    const { app } = buildApp({
      pbFetch: async (path, opts) => {
        pbCalls.push({ path, method: opts?.method || 'GET', body: opts?.body });
        if (path.includes('?filter=')) {
          return { ok: true, status: 200, async json() { return { items: [{ id: 'rec_existing' }] }; } };
        }
        return { ok: true, status: 200, async json() { return {}; } };
      },
    });
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({
      id: 'job_update_001',
      status: { name: 'IN_PRODUCTION', message: 'now printing' },
    });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'lulu-hmac-sha256': sign(body), 'content-type': 'application/json' },
    });

    expect(resp.status).toBe(200);
    const patchCalls = pbCalls.filter(c => c.method === 'PATCH');
    expect(patchCalls.length).toBe(1);
    expect(patchCalls[0].path).toBe('/api/collections/print_orders/records/rec_existing');
    expect(JSON.parse(patchCalls[0].body)).toMatchObject({
      lulu_job_id: 'job_update_001',
      status: 'IN_PRODUCTION',
    });
  });

  it('extracts tracking info on SHIPPED events', async () => {
    const pbCalls = [];
    const { app } = buildApp({
      pbFetch: async (path, opts) => {
        pbCalls.push({ path, method: opts?.method || 'GET', body: opts?.body });
        if (path.includes('?filter=')) {
          return { ok: true, status: 200, async json() { return { items: [{ id: 'rec_shipped' }] }; } };
        }
        return { ok: true, status: 200, async json() { return {}; } };
      },
    });
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({
      id: 'job_shipped_001',
      status: { name: 'SHIPPED', message: 'on its way' },
      line_items: [
        {
          tracking: [
            { carrier: 'UPS', tracking_number: '1Z999AA10123456784' },
            { carrier: 'DHL', tracking_number: 'JD0002022' },
          ],
        },
      ],
    });
    await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'lulu-hmac-sha256': sign(body), 'content-type': 'application/json' },
    });

    const patchCalls = pbCalls.filter(c => c.method === 'PATCH');
    const patchBody = JSON.parse(patchCalls[0].body);
    expect(patchBody.status).toBe('SHIPPED');
    expect(patchBody.tracking_info).toContain('UPS: 1Z999AA10123456784');
    expect(patchBody.tracking_info).toContain('DHL: JD0002022');
  });

  it('sanitises lulu_job_id (strips PocketBase-filter metacharacters) before DB write', async () => {
    const pbCalls = [];
    const { app } = buildApp({
      pbFetch: async (path, opts) => {
        pbCalls.push({ path, method: opts?.method || 'GET', body: opts?.body });
        if (path.includes('?filter=')) {
          return { ok: true, status: 200, async json() { return { items: [] }; } };
        }
        return { ok: true, status: 200, async json() { return {}; } };
      },
    });
    ({ server, url } = await startServer(app));

    // Lulu job IDs are normally UUIDs / digits. A hostile payload that
    // injects PocketBase-filter metachars (quotes, semicolons, parens,
    // backslashes, %, whitespace) must be stripped before being interpolated
    // into the filter= query string.
    const body = JSON.stringify({
      id: "job_normal' || '1'='1",  // attempted filter injection
      status: { name: 'CREATED' },
    });
    await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'lulu-hmac-sha256': sign(body), 'content-type': 'application/json' },
    });

    const filterCall = pbCalls.find(c => c.path.includes('?filter='));
    expect(filterCall).toBeDefined();
    // Pull out just the id value the filter is comparing against — it lives
    // inside single quotes: lulu_job_id='<value>'
    const decoded = decodeURIComponent(filterCall.path);
    const idMatch = decoded.match(/lulu_job_id='([^']*)'/);
    expect(idMatch).not.toBeNull();
    const idInFilter = idMatch[1];
    // The id value must be free of every PocketBase-filter metachar
    expect(idInFilter).not.toMatch(/[' "()=|&;]/);
    // And the persisted body must store the same sanitised id
    const createCall = pbCalls.find(c => c.method === 'POST');
    expect(createCall).toBeDefined();
    const createdId = JSON.parse(createCall.body).lulu_job_id;
    expect(createdId).toBe(idInFilter);
    expect(createdId).not.toMatch(/[' "()=|&;]/);
  });

  it('always returns 200 even when PocketBase fails (prevents Lulu retries)', async () => {
    const { app } = buildApp({
      pbFetch: async () => { throw new Error('PocketBase down'); },
    });
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({
      id: 'job_pb_fails',
      status: { name: 'CREATED' },
    });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'lulu-hmac-sha256': sign(body), 'content-type': 'application/json' },
    });

    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json).toEqual({ received: true });
  });

  it('returns 200 when PocketBase is not configured (skips DB write)', async () => {
    const { app } = buildApp({ isPocketBaseConfigured: false });
    ({ server, url } = await startServer(app));

    const body = JSON.stringify({
      id: 'job_no_pb',
      status: { name: 'CREATED' },
    });
    const resp = await fetch(`${url}/api/lulu/webhook`, {
      method: 'POST',
      body,
      headers: { 'lulu-hmac-sha256': sign(body), 'content-type': 'application/json' },
    });

    expect(resp.status).toBe(200);
  });
});

describe('verifyWebhook (unit)', () => {
  beforeEach(() => {
    process.env.LULU_CLIENT_SECRET = LULU_SECRET;
  });

  it('returns true for a valid signature', () => {
    const body = '{"id":"job_x","status":{"name":"CREATED"}}';
    const sig = crypto.createHmac('sha256', LULU_SECRET).update(body).digest('hex');
    expect(lulu.verifyWebhook(body, sig)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const body = '{"id":"job_x","status":{"name":"CREATED"}}';
    expect(lulu.verifyWebhook(body, '00'.repeat(32))).toBe(false);
  });

  it('returns false when secret is unset', () => {
    delete process.env.LULU_CLIENT_SECRET;
    const body = '{}';
    expect(lulu.verifyWebhook(body, '00'.repeat(32))).toBe(false);
  });

  it('returns false when signature is missing', () => {
    expect(lulu.verifyWebhook('{}', undefined)).toBe(false);
    expect(lulu.verifyWebhook('{}', null)).toBe(false);
    expect(lulu.verifyWebhook('{}', '')).toBe(false);
  });
});

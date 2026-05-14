const express = require('express');
const rateLimit = require('express-rate-limit');
const log = require('../logger');
const { verifyTurnstile } = require('../middleware/turnstile');

/**
 * Contact / Format Request route (Resend email).
 */
module.exports = function contactRoutes() {
  const router = express.Router();

  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many contact requests. Please try again later.' },
  });

  router.post('/api/contact', express.json({ limit: '100kb' }), contactLimiter, verifyTurnstile, async (req, res) => {
    // Honeypot check
    if (req.body.website) return res.json({ ok: true });

    // Timestamp check — reject submissions faster than 2 seconds
    const ts = Number(req.body._t);
    if (!ts || Date.now() - ts < 2000) return res.json({ ok: true });

    const email = String(req.body.email || '').trim().slice(0, 320);
    const message = String(req.body.message || '').trim().slice(0, 5000);

    if (!email || !message) return res.status(400).json({ error: 'missing_fields', message: 'Email and message are required.' });
    // SECURITY: Strict email validation — reject newlines, null bytes, and
    // characters that could enable email header injection via replyTo field.
    if (/[\r\n\0]/.test(email)) return res.status(400).json({ error: 'invalid_email', message: 'Invalid email address.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid_email', message: 'Invalid email address.' });
    // Reject emails with angle brackets or commas (multi-recipient injection)
    if (/[<>,;]/.test(email)) return res.status(400).json({ error: 'invalid_email', message: 'Invalid email address.' });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      log.warn({ module: 'contact' }, 'RESEND_API_KEY not configured — cannot send email');
      return res.status(503).json({ error: 'not_configured', message: 'Contact service is not configured.' });
    }

    try {
      const { Resend } = require('resend');
      const resend = new Resend(resendKey);

      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const escapedEmail = esc(email);
      const escapedMessage = esc(message);
      const nl2br = (s) => s.replace(/\n/g, '<br>');

      // Send notification to support
      await resend.emails.send({
        from: 'PagePerfect <noreply@pageperfect.studio>',
        to: ['support@pageperfect.studio'],
        replyTo: email,
        subject: `Format Request from ${email}`,
        text: [
          'NEW FORMAT REQUEST',
          '----------------------------------------',
          '',
          `From: ${email}`,
          `Time: ${new Date().toISOString()}`,
          `IP:   ${req.ip}`,
          '',
          'Message:',
          message,
          '',
          '----------------------------------------',
          'Sent via PagePerfect /api/contact',
        ].join('\n'),
        html: [
          '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
          '<body style="margin:0;padding:40px 20px;background:#FDFCF8;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#111111;">',
          '<div style="max-width:560px;margin:0 auto;">',
          '  <div style="border-bottom:2px solid #111111;padding-bottom:16px;margin-bottom:24px;">',
          '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(17,17,17,0.4);">Format Request</span>',
          '    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">New submission</h1>',
          '  </div>',
          '  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">',
          `    <tr><td style="padding:6px 0;color:rgba(17,17,17,0.5);width:60px;vertical-align:top;">From</td><td style="padding:6px 0;font-weight:600;">${escapedEmail}</td></tr>`,
          `    <tr><td style="padding:6px 0;color:rgba(17,17,17,0.5);vertical-align:top;">Time</td><td style="padding:6px 0;">${new Date().toISOString()}</td></tr>`,
          `    <tr><td style="padding:6px 0;color:rgba(17,17,17,0.5);vertical-align:top;">IP</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${esc(req.ip || 'unknown')}</td></tr>`,
          '  </table>',
          '  <div style="border-top:1px solid rgba(17,17,17,0.1);padding-top:20px;">',
          '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(17,17,17,0.4);">Message</span>',
          `    <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#333333;">${nl2br(escapedMessage)}</p>`,
          '  </div>',
          '  <div style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(17,17,17,0.1);">',
          '    <span style="font-size:10px;color:rgba(17,17,17,0.3);">Sent via PagePerfect /api/contact</span>',
          '  </div>',
          '</div>',
          '</body></html>',
        ].join('\n'),
      });

      // Send confirmation to the user
      await resend.emails.send({
        from: 'PagePerfect <noreply@pageperfect.studio>',
        to: [email],
        subject: 'We received your format request — PagePerfect',
        text: [
          'Thank you for your format request.',
          '',
          'We have received the following message:',
          '',
          '---',
          message,
          '---',
          '',
          'Our team will review your requirements and follow up at this email address.',
          '',
          'PagePerfect',
          'https://pageperfect.studio',
        ].join('\n'),
        html: [
          '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
          '<body style="margin:0;padding:40px 20px;background:#FDFCF8;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#111111;">',
          '<div style="max-width:560px;margin:0 auto;">',
          '  <div style="border-bottom:2px solid #111111;padding-bottom:16px;margin-bottom:24px;">',
          '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(17,17,17,0.4);">PagePerfect</span>',
          '    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Request received</h1>',
          '  </div>',
          '  <p style="font-size:14px;line-height:1.7;color:#333333;margin:0 0 20px;">Thank you for reaching out. We have received your format request and will review it shortly.</p>',
          '  <div style="background:#f5f5f0;border-left:3px solid #111111;padding:16px 20px;margin-bottom:24px;">',
          '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(17,17,17,0.4);display:block;margin-bottom:8px;">Your message</span>',
          `    <p style="margin:0;font-size:14px;line-height:1.7;color:#333333;">${nl2br(escapedMessage)}</p>`,
          '  </div>',
          '  <p style="font-size:14px;line-height:1.7;color:#333333;margin:0 0 32px;">Our team will follow up at this email address. If you have additional details, reply directly to this email.</p>',
          '  <div style="border-top:2px solid #111111;padding-top:16px;">',
          '    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">PagePerfect</span>',
          '    <p style="margin:4px 0 0;font-size:11px;color:rgba(17,17,17,0.4);">Professional typesetting in your browser</p>',
          '    <a href="https://pageperfect.studio" style="font-size:11px;color:#FF3333;text-decoration:none;display:inline-block;margin-top:4px;">pageperfect.studio</a>',
          '  </div>',
          '</div>',
          '</body></html>',
        ].join('\n'),
      });

      log.info({ module: 'contact', email }, 'Format request sent successfully');
      res.json({ ok: true });
    } catch (err) {
      log.error({ module: 'contact', err: err.message || err }, 'Resend error');
      res.status(500).json({ error: 'send_failed', message: 'Failed to send message. Please try again.' });
    }
  });

  return router;
};

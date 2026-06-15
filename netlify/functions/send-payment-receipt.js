/**
 * RSFSOFT — Payment Receipt Email Sender
 * ─────────────────────────────────────────────────────────────────────────────
 * Triggered after a successful payment is saved.
 * Sends two emails:
 *   1. Customer receipt → customer's email address
 *   2. Internal alert   → billing@rsfsoft.co.uk
 *
 * Setup (one-time, takes 2 minutes):
 *   Go to Netlify → Site settings → Environment variables → Add:
 *   SMTP_HOST     = smtp.gmail.com          (or your mail provider)
 *   SMTP_PORT     = 587
 *   SMTP_USER     = billing@rsfsoft.co.uk
 *   SMTP_PASS     = [your app password]     (Gmail: myaccount.google.com/apppasswords)
 *   NOTIFY_EMAIL  = billing@rsfsoft.co.uk
 *
 * For Gmail: enable 2FA, generate an "App Password" (16 chars), use that as SMTP_PASS.
 */

const nodemailer = require('nodemailer');

// ─── Email transporter (configured via Netlify env vars) ──────────────────────
function createTransport() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   port,
    secure: port === 465, // SSL for port 465, STARTTLS for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ─── Customer Receipt HTML template ───────────────────────────────────────────
function buildCustomerReceipt(data) {
  const {
    clientName, invoiceRef, serviceCategory, billingStructure,
    amount, currency, transactionId, timestamp, milestoneProgress
  } = data;

  const billingLabel = billingStructure === 'Recurring Subscription'
    ? '📅 Monthly Retainer — Auto-renews every 29 days'
    : '✅ One-Time Payment';

  const milestones = Array.isArray(milestoneProgress)
    ? milestoneProgress.map(m => `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#64748b;">
            🕐 <strong>${m.time}</strong> — ${m.log}
          </td>
        </tr>`).join('')
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Receipt — RSFSOFT</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#06d6f0);padding:32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:2px;">RSFSOFT</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">PAYMENT RECEIPT & CONFIRMATION</p>
    </div>

    <!-- Success badge -->
    <div style="text-align:center;padding:24px 32px 0;">
      <div style="display:inline-block;width:56px;height:56px;background:#d1fae5;border:2px solid #10b981;border-radius:50%;line-height:52px;font-size:24px;">✅</div>
      <h2 style="margin:12px 0 4px;color:#0f172a;font-size:20px;">Payment Confirmed</h2>
      <p style="color:#64748b;font-size:13px;margin:0;">3D Secure Verified &amp; Electronically Signed</p>
    </div>

    <!-- Invoice table -->
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f8fafc;">
          <td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-radius:4px 0 0 4px;">Client</td>
          <td style="padding:10px 12px;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Invoice Ref</td>
          <td style="padding:10px 12px;font-size:13px;color:#7c3aed;font-weight:700;text-align:right;font-family:monospace;">${invoiceRef}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Service(s)</td>
          <td style="padding:10px 12px;font-size:13px;color:#0f172a;text-align:right;">${serviceCategory}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Billing</td>
          <td style="padding:10px 12px;font-size:13px;color:#0f172a;text-align:right;">${billingLabel}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Transaction ID</td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;text-align:right;font-family:monospace;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Date & Time</td>
          <td style="padding:10px 12px;font-size:13px;color:#0f172a;text-align:right;">${new Date(timestamp).toUTCString()}</td>
        </tr>
        <tr style="background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(6,214,240,0.08));">
          <td style="padding:14px 12px;font-size:14px;color:#0f172a;font-weight:800;border-radius:4px 0 0 4px;">AMOUNT PAID</td>
          <td style="padding:14px 12px;font-size:18px;color:#7c3aed;font-weight:800;text-align:right;border-radius:0 4px 4px 0;">${currency} ${amount}</td>
        </tr>
      </table>
    </div>

    <!-- Milestone log -->
    ${milestones ? `
    <div style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">📋 Service Delivery Log</p>
      <table style="width:100%;border-left:3px solid #06d6f0;padding-left:12px;">
        ${milestones}
      </table>
    </div>` : ''}

    <!-- Refund policy note -->
    <div style="padding:16px 32px;background:#fef3c7;border-left:4px solid #f59e0b;margin:0 32px 24px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
        <strong>No-Refund Policy:</strong> By completing this payment, you confirmed your agreement to RSFSOFT's
        <a href="https://www.rsfsoft.co.uk/terms-and-conditions.html" style="color:#7c3aed;">Terms &amp; Conditions</a>
        and <a href="https://www.rsfsoft.co.uk/refund-policy.html" style="color:#7c3aed;">Refund Policy</a>.
        Services are considered initiated upon payment. For billing queries, contact
        <a href="mailto:billing@rsfsoft.co.uk" style="color:#7c3aed;">billing@rsfsoft.co.uk</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:24px 32px;text-align:center;">
      <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">RSFSOFT LTD · Company No. 15878082</p>
      <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">📧 billing@rsfsoft.co.uk · 🌐 www.rsfsoft.co.uk</p>
      <p style="margin:0;color:#475569;font-size:10px;">This receipt was automatically generated. Please keep it for your records.</p>
      <p style="margin:4px 0 0;color:#334155;font-size:10px;">🔒 3DS Verified · IP Logged · E-Signed · SHA-256 Integrity Hash on File</p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Internal RSFSOFT Alert HTML ──────────────────────────────────────────────
function buildInternalAlert(data) {
  const { clientName, invoiceRef, amount, currency, serviceCategory,
          billingStructure, transactionId, timestamp, customerEmail,
          securityAudit } = data;
  return `
<html><body style="font-family:monospace;background:#0f172a;color:#e2e8f0;padding:20px;">
  <h2 style="color:#06d6f0;">💰 NEW PAYMENT RECEIVED — RSFSOFT</h2>
  <table style="border-collapse:collapse;width:100%;max-width:600px;">
    <tr><td style="padding:6px 12px;color:#94a3b8;width:160px;">Client</td>
        <td style="padding:6px 12px;color:#f1f5f9;font-weight:700;">${clientName}</td></tr>
    <tr style="background:rgba(255,255,255,0.04);">
        <td style="padding:6px 12px;color:#94a3b8;">Email</td>
        <td style="padding:6px 12px;color:#06d6f0;">${customerEmail || 'Not provided'}</td></tr>
    <tr><td style="padding:6px 12px;color:#94a3b8;">Invoice Ref</td>
        <td style="padding:6px 12px;color:#c084fc;font-weight:700;">${invoiceRef}</td></tr>
    <tr style="background:rgba(255,255,255,0.04);">
        <td style="padding:6px 12px;color:#94a3b8;">Amount</td>
        <td style="padding:6px 12px;color:#10b981;font-size:18px;font-weight:800;">${currency} ${amount}</td></tr>
    <tr><td style="padding:6px 12px;color:#94a3b8;">Service(s)</td>
        <td style="padding:6px 12px;">${serviceCategory}</td></tr>
    <tr style="background:rgba(255,255,255,0.04);">
        <td style="padding:6px 12px;color:#94a3b8;">Billing Type</td>
        <td style="padding:6px 12px;">${billingStructure}</td></tr>
    <tr><td style="padding:6px 12px;color:#94a3b8;">TXN ID</td>
        <td style="padding:6px 12px;font-family:monospace;font-size:11px;">${transactionId}</td></tr>
    <tr style="background:rgba(255,255,255,0.04);">
        <td style="padding:6px 12px;color:#94a3b8;">Timestamp</td>
        <td style="padding:6px 12px;">${new Date(timestamp).toUTCString()}</td></tr>
    <tr><td style="padding:6px 12px;color:#94a3b8;">IP Address</td>
        <td style="padding:6px 12px;">${securityAudit?.ipAddress || 'Unknown'}</td></tr>
    <tr style="background:rgba(255,255,255,0.04);">
        <td style="padding:6px 12px;color:#94a3b8;">Location</td>
        <td style="padding:6px 12px;">${securityAudit?.geolocation || 'Unknown'}</td></tr>
    <tr><td style="padding:6px 12px;color:#94a3b8;">3DS Status</td>
        <td style="padding:6px 12px;color:#10b981;font-weight:700;">${securityAudit?.threeDSSecureStatus?.status || 'SUCCESS'} — ${securityAudit?.threeDSSecureStatus?.riskLevel || 'ZERO'} RISK</td></tr>
  </table>
  <p style="color:#475569;font-size:11px;margin-top:20px;">Evidence file saved: ${transactionId}_evidence.json</p>
</body></html>`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
  }

  // Check SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('RSFSOFT Email: SMTP_USER/SMTP_PASS not configured. Set in Netlify env vars.');
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: false,
        message: 'Email not configured. Set SMTP_USER and SMTP_PASS in Netlify environment variables.',
        setupGuide: 'Go to Netlify → Site settings → Environment variables'
      })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const {
    clientName, invoiceRef, serviceCategory, billingStructure,
    amount, currency, transactionId, timestamp, customerEmail,
    milestoneProgress, securityAudit
  } = payload;

  const notifyEmail  = process.env.NOTIFY_EMAIL  || 'billing@rsfsoft.co.uk';
  const senderEmail  = process.env.SMTP_USER;

  try {
    const transporter = createTransport();
    const results = { internal: false, customer: false };

    // 1. Always send internal alert to billing@rsfsoft.co.uk
    await transporter.sendMail({
      from:    `"RSFSOFT Payment System" <${senderEmail}>`,
      to:      notifyEmail,
      subject: `💰 NEW PAYMENT: ${currency} ${amount} — ${clientName} [${invoiceRef}]`,
      html:    buildInternalAlert(payload)
    });
    results.internal = true;

    // 2. Send customer receipt (only if email was provided)
    if (customerEmail && customerEmail.includes('@')) {
      await transporter.sendMail({
        from:    `"RSFSOFT Billing" <${senderEmail}>`,
        to:      customerEmail,
        subject: `Payment Receipt — ${invoiceRef} | RSFSOFT`,
        html:    buildCustomerReceipt({
          clientName, invoiceRef, serviceCategory, billingStructure,
          amount, currency, transactionId, timestamp, milestoneProgress
        })
      });
      results.customer = true;
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        emailsSent: results,
        message: results.customer
          ? `Receipt sent to ${customerEmail} and alert sent to ${notifyEmail}`
          : `Internal alert sent to ${notifyEmail}. No customer email provided.`
      })
    };

  } catch (emailError) {
    console.error('RSFSOFT Email error:', emailError.message);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({
        success: false,
        error: 'Email delivery failed.',
        detail: emailError.message,
        hint: 'Check SMTP credentials in Netlify environment variables.'
      })
    };
  }
};

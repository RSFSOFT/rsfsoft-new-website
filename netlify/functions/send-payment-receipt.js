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
    amount, currency, transactionId, timestamp
  } = data;

  const billingLabel = billingStructure === 'Recurring Subscription'
    ? '📅 Monthly Retainer — Auto-renews every 29 days'
    : '✅ One-Time Payment';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Receipt — RSFSOFT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#04070f;font-family:'Outfit','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0f6ff;padding:30px 10px;">
  <div style="max-width:560px;margin:0 auto;background:#080d1a;border:1px solid rgba(124,58,237,0.2);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#06d6f0);padding:36px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:3px;">RSFSOFT</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;letter-spacing:1px;font-family:'Inter',sans-serif;">PAYMENT RECEIPT & CONFIRMATION</p>
    </div>

    <!-- Success badge -->
    <div style="text-align:center;padding:28px 32px 0;">
      <div style="display:inline-block;width:56px;height:56px;background:rgba(6,214,240,0.12);border:2px solid #06d6f0;border-radius:50%;line-height:56px;font-size:24px;color:#06d6f0;box-shadow:0 0 20px rgba(6,214,240,0.2);">✓</div>
      <h2 style="margin:16px 0 4px;color:#f0f6ff;font-size:22px;font-weight:700;">Payment Confirmed</h2>
      <p style="color:#94a3b8;font-size:13px;margin:0;font-family:'Inter',sans-serif;">Thank you for your payment.</p>
    </div>

    <!-- Invoice table -->
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#0e1526;">
          <td style="padding:12px 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:6px 0 0 6px;">Client</td>
          <td style="padding:12px 14px;font-size:13px;color:#f0f6ff;font-weight:600;text-align:right;border-radius:0 6px 6px 0;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Invoice Ref</td>
          <td style="padding:12px 14px;font-size:13px;color:#06d6f0;font-weight:700;text-align:right;font-family:monospace;letter-spacing:0.5px;">${invoiceRef}</td>
        </tr>
        <tr style="background:#0e1526;">
          <td style="padding:12px 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:6px 0 0 6px;">Service(s)</td>
          <td style="padding:12px 14px;font-size:13px;color:#f0f6ff;text-align:right;border-radius:0 6px 6px 0;">${serviceCategory}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Billing</td>
          <td style="padding:12px 14px;font-size:13px;color:#f0f6ff;text-align:right;">${billingLabel}</td>
        </tr>
        <tr style="background:#0e1526;">
          <td style="padding:12px 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:6px 0 0 6px;">Transaction ID</td>
          <td style="padding:12px 14px;font-size:12px;color:#94a3b8;text-align:right;font-family:monospace;border-radius:0 6px 6px 0;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Date & Time</td>
          <td style="padding:12px 14px;font-size:13px;color:#f0f6ff;text-align:right;">${new Date(timestamp).toUTCString()}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:18px 0 0 0;">
            <div style="background:linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(6,214,240,0.12) 100%);border:1px solid rgba(6,214,240,0.3);border-radius:8px;padding:16px;text-align:center;">
              <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;font-family:'Inter',sans-serif;">Amount Paid</span>
              <span style="font-size:26px;color:#06d6f0;font-weight:800;letter-spacing:1px;">${currency} ${amount}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Support / Agreement reference -->
    <div style="padding:16px 24px;background:rgba(124,58,237,0.05);border-left:4px solid #7c3aed;margin:0 32px 28px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;font-family:'Inter',sans-serif;">
        This receipt confirms your agreement to RSFSOFT's
        <a href="https://www.rsfsoft.co.uk/terms-and-conditions.html" style="color:#06d6f0;text-decoration:none;">Terms of Service</a>
        and <a href="https://www.rsfsoft.co.uk/refund-policy.html" style="color:#06d6f0;text-decoration:none;">Refund Policy</a>.
        If you have any questions regarding your invoice or service initiation, please contact us at
        <a href="mailto:billing@rsfsoft.co.uk" style="color:#06d6f0;text-decoration:none;">billing@rsfsoft.co.uk</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#04070f;padding:28px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;font-family:'Inter',sans-serif;">RSFSOFT LTD · Company No. 15878082</p>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;font-family:'Inter',sans-serif;">📧 billing@rsfsoft.co.uk · 🌐 www.rsfsoft.co.uk</p>
      <p style="margin:0;color:#4b5e7a;font-size:10px;font-family:'Inter',sans-serif;">This receipt was automatically generated. Please keep it for your records.</p>
      <p style="margin:4px 0 0;color:#4b5e7a;font-size:10px;font-family:'Inter',sans-serif;">🔒 Secured and processed via Airwallex. All payments are encrypted.</p>
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
  <h2 style="color:#06d6f0;">New Payment Alert — RSFSOFT</h2>
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
      subject: `[New Payment Alert] ${currency} ${amount} from ${clientName}`,
      html:    buildInternalAlert(payload)
    });
    results.internal = true;

    // 2. Send customer receipt (only if email was provided)
    if (customerEmail && customerEmail.includes('@')) {
      await transporter.sendMail({
        from:    `"RSFSOFT Billing" <${senderEmail}>`,
        to:      customerEmail,
        subject: `Payment Receipt for Invoice ${invoiceRef} — RSFSOFT`,
        html:    buildCustomerReceipt({
          clientName, invoiceRef, serviceCategory, billingStructure,
          amount, currency, transactionId, timestamp
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

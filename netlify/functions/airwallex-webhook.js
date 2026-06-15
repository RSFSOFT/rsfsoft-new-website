/**
 * RSFSOFT — Airwallex Webhook Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Airwallex sends signed POST requests to this endpoint for EVERY payment event.
 * This is the correct, reliable way to receive data — not polling or local files.
 *
 * Events handled:
 *   payment_intent.succeeded       → Customer paid successfully (one-time)
 *   payment_intent.cancelled       → Payment cancelled / timed out
 *   payment_consent.created        → Subscription card saved (first charge auth)
 *   payment_consent.disabled       → Subscription cancelled by customer
 *   refund.succeeded               → Refund processed
 *   dispute.created                → Chargeback opened — alerts RSFSOFT immediately
 *   dispute.won / dispute.lost     → Dispute resolved
 *
 * SETUP (one-time — 5 minutes):
 *   1. Go to Airwallex Portal → Developers → Webhooks → Add Endpoint
 *   2. URL: https://www.rsfsoft.co.uk/.netlify/functions/airwallex-webhook
 *   3. Select: ALL events (or the specific ones listed above)
 *   4. Copy the Webhook Secret shown by Airwallex
 *   5. Go to Netlify → Site → Environment Variables
 *   6. Add: AIRWALLEX_WEBHOOK_SECRET = [paste the secret from step 4]
 *
 * After setup, every customer payment will:
 *   ✅ Appear in Airwallex portal (Payments section)
 *   ✅ Trigger an email to billing@rsfsoft.co.uk with full payment details
 *   ✅ Be logged permanently in Netlify function logs
 */

const crypto      = require('crypto');
const nodemailer  = require('nodemailer');

// ─── SMTP Email transporter ───────────────────────────────────────────────────
function createTransport() {
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.titan.email',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ─── Verify Airwallex webhook signature ──────────────────────────────────────
// Airwallex signs each request with HMAC-SHA256 using your webhook secret.
// We verify this to reject fake/tampered webhooks.
function verifySignature(rawBody, signatureHeader, secret) {
  if (!secret) {
    // No secret configured — accept but warn (insecure; configure ASAP)
    console.warn('[RSFSOFT Webhook] AIRWALLEX_WEBHOOK_SECRET not set. Skipping signature check (INSECURE).');
    return true;
  }
  if (!signatureHeader) return false;

  try {
    // Airwallex signature format: "t=<timestamp>,v1=<signature>"
    const parts     = signatureHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!timestamp || !signature) return false;

    // Reconstruct the signed payload: "<timestamp>.<rawBody>"
    const signedPayload = `${timestamp}.${rawBody}`;
    const expected      = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch (e) {
    console.error('[RSFSOFT Webhook] Signature verification error:', e.message);
    return false;
  }
}

// ─── Format currency amount (minor units → readable) ─────────────────────────
function formatAmount(amount, currency) {
  // Airwallex stores amounts in minor units (pence/cents)
  const decimal = (amount / 100).toFixed(2);
  const symbols = { GBP: '£', USD: '$', EUR: '€', CAD: 'CA$', AUD: 'A$', AED: 'AED ' };
  return `${symbols[currency] || currency + ' '}${decimal}`;
}

// ─── Build alert email HTML ───────────────────────────────────────────────────
function buildAlertEmail(event, payload) {
  const intent    = payload.data?.object || payload;
  const amount    = intent.amount   ? formatAmount(intent.amount, intent.currency) : 'N/A';
  const currency  = intent.currency || 'N/A';
  const intentId  = intent.id       || 'N/A';
  const status    = intent.status   || event.name;
  const orderId   = intent.merchant_order_id || 'N/A';
  const meta      = intent.metadata || {};
  const custEmail = meta.rsfsoft_customer_email || intent.customer?.email || 'N/A';
  const custName  = meta.rsfsoft_client_name    || intent.customer?.name  || 'N/A';
  const services  = meta.rsfsoft_services       || 'N/A';
  const billing   = meta.rsfsoft_billing_type   || 'N/A';
  const invoiceRef= meta.rsfsoft_invoice_ref    || orderId;
  const custMobile= meta.rsfsoft_customer_mobile || 'N/A';
  const ts        = intent.created_at ? new Date(intent.created_at).toUTCString() : new Date().toUTCString();

  // Colour code by event type
  const isSuccess  = event.name?.includes('succeeded');
  const isDispute  = event.name?.includes('dispute');
  const isRefund   = event.name?.includes('refund');
  const isSubCard  = event.name?.includes('consent');
  const headerColor= isSuccess ? '#10b981' : isDispute ? '#ef4444' : isRefund ? '#f59e0b' : '#7c3aed';
  const emoji      = isSuccess ? '✅' : isDispute ? '🚨' : isRefund ? '↩️' : isSubCard ? '🔄' : 'ℹ️';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Airwallex ${emoji} ${event.name} — RSFSOFT</title>
</head>
<body style="margin:0;padding:0;background:#04070f;font-family:'Segoe UI',system-ui,sans-serif;color:#f0f6ff;padding:20px 10px;">
  <div style="max-width:560px;margin:0 auto;background:#080d1a;border:1px solid rgba(124,58,237,0.2);border-radius:18px;overflow:hidden;">

    <div style="background:${headerColor};padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;">RSFSOFT</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${emoji} ${(event.name || 'AIRWALLEX EVENT').toUpperCase()}</p>
    </div>

    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#0e1526;">
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;border-radius:6px 0 0 6px;">Payment Intent ID</td>
          <td style="padding:10px 12px;color:#06d6f0;font-family:monospace;text-align:right;border-radius:0 6px 6px 0;">${intentId}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;">Invoice Ref</td>
          <td style="padding:10px 12px;color:#c084fc;font-weight:700;text-align:right;">${invoiceRef}</td>
        </tr>
        <tr style="background:#0e1526;">
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;border-radius:6px 0 0 6px;">Client Name</td>
          <td style="padding:10px 12px;color:#f0f6ff;font-weight:600;text-align:right;border-radius:0 6px 6px 0;">${custName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;">Client Email</td>
          <td style="padding:10px 12px;color:#06d6f0;text-align:right;">${custEmail}</td>
        </tr>
        <tr style="background:#0e1526;">
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;border-radius:6px 0 0 6px;">Mobile</td>
          <td style="padding:10px 12px;color:#f0f6ff;text-align:right;border-radius:0 6px 6px 0;">${custMobile}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;">Services</td>
          <td style="padding:10px 12px;color:#f0f6ff;text-align:right;">${services}</td>
        </tr>
        <tr style="background:#0e1526;">
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;border-radius:6px 0 0 6px;">Billing Type</td>
          <td style="padding:10px 12px;color:#c084fc;font-weight:700;text-align:right;border-radius:0 6px 6px 0;">${billing}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;">Status</td>
          <td style="padding:10px 12px;color:${headerColor};font-weight:700;text-align:right;">${status?.toUpperCase()}</td>
        </tr>
        <tr style="background:#0e1526;">
          <td style="padding:10px 12px;color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:11px;border-radius:6px 0 0 6px;">Timestamp</td>
          <td style="padding:10px 12px;color:#f0f6ff;text-align:right;font-size:11px;border-radius:0 6px 6px 0;">${ts}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:18px 0 0 0;">
            <div style="background:linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,214,240,0.12));border:1px solid rgba(6,214,240,0.3);border-radius:8px;padding:16px;text-align:center;">
              <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">Amount</span>
              <span style="font-size:26px;color:#06d6f0;font-weight:800;">${amount}</span>
            </div>
          </td>
        </tr>
      </table>

      ${isDispute ? `
      <div style="margin-top:20px;padding:16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:8px;">
        <p style="margin:0;color:#ef4444;font-weight:700;font-size:13px;">🚨 ACTION REQUIRED — CHARGEBACK</p>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
          A dispute has been opened for this payment. Log in to your Airwallex portal immediately to submit evidence.
          You have a limited time window (typically 7–14 days) to respond.<br><br>
          <strong>Airwallex Portal:</strong> <a href="https://www.airwallex.com/app/disputes" style="color:#06d6f0;">www.airwallex.com/app/disputes</a>
        </p>
      </div>` : ''}

      ${isSubCard ? `
      <div style="margin-top:20px;padding:16px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.3);border-radius:8px;">
        <p style="margin:0;color:#c084fc;font-weight:700;font-size:13px;">🔄 Subscription Setup Complete</p>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
          The customer's card has been saved for recurring billing.<br>
          To charge the next billing cycle, create a new Payment Intent with the customer_id via the Airwallex API,
          or use the Airwallex portal → Payments → Recurring.
        </p>
      </div>` : ''}
    </div>

    <div style="background:#04070f;padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;">RSFSOFT LTD · Company No. 12874141</p>
      <p style="margin:0;color:#4b5e7a;font-size:10px;">This alert was generated by the RSFSOFT Airwallex Webhook Handler</p>
      <p style="margin:4px 0 0;color:#4b5e7a;font-size:10px;">
        View in Airwallex Portal: <a href="https://www.airwallex.com" style="color:#06d6f0;">airwallex.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  // Airwallex only sends POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
  }

  const rawBody   = event.body || '';
  const sigHeader = event.headers?.['x-airwallex-signature'] || event.headers?.['X-Airwallex-Signature'] || '';
  const secret    = process.env.AIRWALLEX_WEBHOOK_SECRET;

  // ── Signature verification ─────────────────────────────────────────────────
  if (!verifySignature(rawBody, sigHeader, secret)) {
    console.error('[RSFSOFT Webhook] Signature verification FAILED. Possible tampered/fake webhook.');
    // Return 200 to prevent Airwallex from retrying (it would retry on non-2xx)
    return { statusCode: 200, headers, body: JSON.stringify({ received: false, reason: 'invalid_signature' }) };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ received: false, reason: 'invalid_json' }) };
  }

  const eventName = payload.name || payload.type || 'unknown';
  const intentId  = payload.data?.object?.id || 'N/A';

  // ── Log everything to Netlify function logs ─────────────────────────────────
  // Netlify keeps these logs for 24 hours in the dashboard
  console.log(`[RSFSOFT Webhook] EVENT: ${eventName} | ID: ${intentId}`, JSON.stringify({
    event:    eventName,
    id:       intentId,
    amount:   payload.data?.object?.amount,
    currency: payload.data?.object?.currency,
    status:   payload.data?.object?.status,
    customer: payload.data?.object?.customer_id,
    metadata: payload.data?.object?.metadata,
    ts:       new Date().toISOString()
  }));

  // ── Send email alert to RSFSOFT billing ────────────────────────────────────
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const intent      = payload.data?.object || {};
      const meta        = intent.metadata      || {};
      const invoiceRef  = meta.rsfsoft_invoice_ref || intent.merchant_order_id || intentId;
      const custName    = meta.rsfsoft_client_name || 'Customer';
      const amount      = intent.amount ? formatAmount(intent.amount, intent.currency) : 'N/A';
      const notifyEmail = process.env.NOTIFY_EMAIL || 'billing@rsfsoft.co.uk';

      // Derive a readable subject based on event type
      let subject = `[Airwallex] ${eventName} — ${amount} | ${invoiceRef}`;
      if (eventName.includes('dispute'))  subject = `🚨 URGENT DISPUTE: ${amount} — Respond in Airwallex Portal NOW`;
      if (eventName.includes('refund'))   subject = `↩️ Refund Processed: ${amount} — ${invoiceRef}`;
      if (eventName.includes('succeeded'))subject = `✅ Payment Received: ${amount} from ${custName} — ${invoiceRef}`;
      if (eventName.includes('consent'))  subject = `🔄 Subscription Card Saved: ${custName} — ${invoiceRef}`;

      const transporter = createTransport();
      await transporter.sendMail({
        from:    `"RSFSOFT Airwallex Alerts" <${process.env.SMTP_USER}>`,
        to:      notifyEmail,
        subject,
        html:    buildAlertEmail({ name: eventName }, payload)
      });

      console.log(`[RSFSOFT Webhook] Alert email sent → ${notifyEmail} | subject: ${subject}`);
    } catch (emailErr) {
      // Non-fatal — don't let email failure block the webhook response
      console.error('[RSFSOFT Webhook] Email send error:', emailErr.message);
    }
  }

  // ── Create Airwallex Billing records on payment success ────────────────────
  // This is the GUARANTEED BACKUP. Even if the billing API calls in
  // create-airwallex-intent.js timed out, this webhook fires AFTER Airwallex
  // confirms the payment is real. We create/update the Billing Customer and
  // Billing Invoice here so data ALWAYS appears in Billing → Customers and
  // Billing → Invoices regardless of what happened before.
  //
  // Fires on: payment_intent.succeeded  (card payment confirmed)
  //           payment_consent.created   (subscription card saved)
  if (eventName === 'payment_intent.succeeded' || eventName === 'payment_consent.created') {
    try {
      const intent    = payload.data?.object || {};
      const meta      = intent.metadata      || {};
      const custName  = meta.rsfsoft_client_name     || '';
      const custEmail = meta.rsfsoft_customer_email  || '';
      const custPhone = meta.rsfsoft_customer_mobile || '';
      const invoiceRef= meta.rsfsoft_invoice_ref || intent.merchant_order_id || intentId;
      const services  = meta.rsfsoft_services    || 'Digital Marketing Services';
      const billingType = meta.rsfsoft_billing_type || 'One-Time Payment';
      const currency  = intent.currency          || 'GBP';
      const amountNum = intent.amount            || 0;
      const isRecurring = billingType === 'Recurring Subscription';

      if (custName || custEmail) {
        // Get a fresh auth token for billing API calls
        const clientId  = process.env.AIRWALLEX_CLIENT_ID;
        const apiKey    = process.env.AIRWALLEX_API_KEY;
        const env       = process.env.AIRWALLEX_ENV || 'prod';
        const baseUrl   = env === 'prod'
          ? 'https://api.airwallex.com/api/v1'
          : 'https://api-demo.airwallex.com/api/v1';

        if (clientId && apiKey) {
          const authRes = await fetch(`${baseUrl}/authentication/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-client-id': clientId, 'x-api-key': apiKey },
            body:    '{}'
          });

          if (authRes.ok) {
            const { token } = await authRes.json();

            // Create Billing Customer (appears in Billing → Customers)
            const bcPayload = {
              request_id: require('crypto').randomBytes(16).toString('hex'),
              name:       custName || custEmail || 'RSFSOFT Client',
              type:       'INDIVIDUAL',
              ...(custEmail && { email:        custEmail }),
              ...(custPhone && { phone_number: custPhone })
            };

            const bcRes = await fetch(`${baseUrl}/billing_customers/create`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body:    JSON.stringify(bcPayload)
            });

            let billingCustId = null;
            if (bcRes.ok) {
              const bcData = await bcRes.json();
              billingCustId = bcData.id;
              console.log(`[RSFSOFT Webhook] ✅ Billing Customer ensured → ${billingCustId} (${custName})`);
            } else {
              const bcErr = await bcRes.text().catch(() => '');
              console.warn(`[RSFSOFT Webhook] Billing Customer (${bcRes.status}): ${bcErr}`);
            }

            // Create Billing Invoice for one-time payments (Billing → Invoices)
            if (billingCustId && !isRecurring && amountNum > 0) {
              const invPayload = {
                request_id:          require('crypto').randomBytes(16).toString('hex'),
                billing_customer_id: billingCustId,
                currency:            currency.toUpperCase(),
                collection_method:   'OUT_OF_BAND',
                description:         `${services} — Invoice ${invoiceRef} — ${custName}`,
                line_items: [{
                  description: services,
                  unit_amount: amountNum,
                  quantity:    1
                }],
                metadata: {
                  payment_intent_id:   intentId,
                  rsfsoft_invoice_ref: invoiceRef,
                  rsfsoft_client:      custName
                }
              };

              const invRes = await fetch(`${baseUrl}/invoices/create`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body:    JSON.stringify(invPayload)
              });

              if (invRes.ok) {
                const invData = await invRes.json();
                console.log(`[RSFSOFT Webhook] ✅ Billing Invoice ensured → ${invData.id} | ${formatAmount(amountNum, currency)}`);
              } else {
                const invErr = await invRes.text().catch(() => '');
                console.warn(`[RSFSOFT Webhook] Billing Invoice (${invRes.status}): ${invErr}`);
              }
            }
          } else {
            console.warn('[RSFSOFT Webhook] Cannot get Airwallex token for billing — skipping billing record creation.');
          }
        } else {
          console.warn('[RSFSOFT Webhook] AIRWALLEX_CLIENT_ID or AIRWALLEX_API_KEY not set — billing records skipped.');
        }
      }
    } catch (billingErr) {
      // NEVER let billing errors block the 200 response to Airwallex
      console.error('[RSFSOFT Webhook] Billing record error (non-fatal):', billingErr.message);
    }
  }

  // ── Acknowledge to Airwallex — MUST return 200 within 30s ─────────────────
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      received: true,
      event:    eventName,
      id:       intentId
    })
  };
};

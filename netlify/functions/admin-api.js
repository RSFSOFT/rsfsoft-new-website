/**
 * RSFSOFT — Admin API
 * ─────────────────────────────────────────────────────────────────
 * Secure backend for the admin panel dashboard.
 * Authenticates admin password, fetches live payment data from Airwallex.
 *
 * Setup: Add ADMIN_PASSWORD to Netlify → Site Settings → Environment Variables
 */

const crypto = require('crypto');

const ALLOWED_ORIGINS = [
  'https://www.rsfsoft.co.uk',
  'https://rsfsoft.co.uk',
  'https://rsfsoft-new-website.netlify.app',
  'http://localhost:8888',
  'http://localhost:3000'
];

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  const headers = {
    'Access-Control-Allow-Origin':  isAllowed ? origin : 'https://rsfsoft.co.uk',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Admin panel not configured. Add ADMIN_PASSWORD to Netlify environment variables.' }) };
  }

  const authHeader = (event.headers.authorization || event.headers.Authorization || '').replace('Bearer ', '').trim();
  const expectedHash = crypto.createHash('sha256').update(adminPassword).digest('hex');
  const providedHash  = crypto.createHash('sha256').update(authHeader).digest('hex');

  // Timing-safe comparison
  if (!crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(providedHash))) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid admin password.' }) };
  }

  // ── Airwallex Auth ───────────────────────────────────────────────────────────
  const airwallexEnv = process.env.AIRWALLEX_ENV || 'demo';
  const clientId     = process.env.AIRWALLEX_CLIENT_ID;
  const apiKey       = process.env.AIRWALLEX_API_KEY;
  const baseUrl      = airwallexEnv === 'prod'
    ? 'https://api.airwallex.com/api/v1'
    : 'https://api-demo.airwallex.com/api/v1';

  if (!clientId || !apiKey) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Airwallex credentials not configured.' }) };
  }

  try {
    const authRes = await fetch(`${baseUrl}/authentication/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': clientId.trim(), 'x-api-key': apiKey.trim() }
    });
    if (!authRes.ok) {
      const err = await authRes.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Airwallex auth failed', detail: err.slice(0,200) }) };
    }
    const { token } = await authRes.json();

    // ── Query params ─────────────────────────────────────────────────────────
    const q         = event.queryStringParameters || {};
    const pageNum   = parseInt(q.page  || '1', 10);
    const pageSize  = Math.min(parseInt(q.page_size || '50', 10), 100);
    const currency  = q.currency || '';
    const status    = q.status   || '';
    const fromDate  = q.from_date || '';
    const toDate    = q.to_date   || '';
    const action    = q.action   || 'list'; // list | stats

    // ── Fetch Payment Intents ─────────────────────────────────────────────────
    const qp = new URLSearchParams({ page_num: String(pageNum), page_size: String(pageSize) });
    if (currency) qp.set('currency', currency.toUpperCase());
    if (status)   qp.set('status',   status.toUpperCase());
    if (fromDate) qp.set('from_created_date', fromDate);
    if (toDate)   qp.set('to_created_date',   toDate);

    const intentsRes = await fetch(`${baseUrl}/pa/payment_intents?${qp}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!intentsRes.ok) {
      const err = await intentsRes.json().catch(() => ({}));
      return { statusCode: intentsRes.status, headers, body: JSON.stringify({ error: 'Failed to fetch intents', detail: err }) };
    }

    const data = await intentsRes.json();
    const items = data.items || [];

    // ── Format each intent ────────────────────────────────────────────────────
    const formatted = items.map(intent => {
      const meta = intent.metadata || {};
      const pm   = intent.latest_payment_attempt?.payment_method || {};
      const card = pm.card || {};
      return {
        id:            intent.id,
        createdAt:     intent.created_at,
        updatedAt:     intent.updated_at,
        status:        intent.status,
        amount:        intent.amount,
        currency:      intent.currency,
        invoiceRef:    intent.merchant_order_id || meta.rsfsoft_invoice_ref || '—',
        clientName:    meta.rsfsoft_client_name    || '—',
        email:         meta.rsfsoft_customer_email || '—',
        mobile:        meta.rsfsoft_customer_mobile|| '—',
        services:      meta.rsfsoft_services       || '—',
        billingType:   meta.rsfsoft_billing_type   || 'One-Time Payment',
        customerId:    meta.rsfsoft_customer_id    || '—',
        cardBrand:     card.brand    || '',
        cardLast4:     card.last4    || '',
        cardExpiry:    card.expiry_month ? `${card.expiry_month}/${card.expiry_year}` : '',
        paymentMethod: pm.type || '—',
        descriptor:    intent.descriptor || 'RSFSOFT LTD',
      };
    });

    // ── Compute summary stats ─────────────────────────────────────────────────
    const succeeded   = formatted.filter(i => i.status === 'SUCCEEDED');
    const pending     = formatted.filter(i => ['REQUIRES_PAYMENT_METHOD','REQUIRES_CUSTOMER_ACTION','REQUIRES_CAPTURE','CREATED'].includes(i.status));
    const failed      = formatted.filter(i => i.status === 'CANCELLED' || i.status === 'FAILED');

    // Group revenue by currency
    const revenueMap = {};
    succeeded.forEach(i => {
      revenueMap[i.currency] = (revenueMap[i.currency] || 0) + i.amount;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        payments:  formatted,
        hasMore:   data.has_more,
        nextPage:  data.next_page_num,
        total:     data.total_count,
        pageNum,
        pageSize,
        summary: {
          total:       formatted.length,
          succeeded:   succeeded.length,
          pending:     pending.length,
          failed:      failed.length,
          revenue:     revenueMap,
          successRate: formatted.length > 0 ? Math.round((succeeded.length / formatted.length) * 100) : 0
        }
      })
    };

  } catch (err) {
    console.error('[RSFSOFT Admin] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', detail: err.message }) };
  }
};

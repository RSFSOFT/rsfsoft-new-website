const crypto = require('crypto');

const ALLOWED_ORIGINS = [
  'https://www.rsfsoft.co.uk',
  'https://rsfsoft.co.uk',
  'https://rsfsoft-new-website.netlify.app',
  'http://localhost:8888',
  'http://localhost:3000',
  'http://localhost:5173'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Split "Faizan Khan" → { first: "Faizan", last: "Khan" } */
function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/**
 * Create or retrieve an Airwallex Customer record.
 * Uses email as the stable merchant_customer_id so the same customer
 * is never duplicated in your portal.
 * Returns the Airwallex customer_id string, or null if creation fails.
 */
async function upsertCustomer(baseUrl, token, { clientName, customerEmail, customerMobile, invoiceRef }) {
  if (!customerEmail) return null;

  // Airwallex requires merchant_customer_id to be unique per customer.
  // We derive it from the email so the same person always maps to the same record.
  const merchantCustomerId = 'RSF-' + crypto.createHash('sha256').update(customerEmail.toLowerCase().trim()).digest('hex').slice(0, 20);

  const { first, last } = splitName(clientName);

  // Try to create — if it already exists (409), fetch by merchant_customer_id
  const createRes = await fetch(`${baseUrl}/pa/customers/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      request_id:           crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      merchant_customer_id: merchantCustomerId,
      first_name:           first || clientName || 'Client',
      last_name:            last  || '',
      email:                customerEmail,
      phone_number:         customerMobile || undefined,
      additional_info: {
        note: `Invoice ref: ${invoiceRef}`
      }
    })
  });

  if (createRes.ok) {
    const cust = await createRes.json();
    console.log(`[RSFSOFT] Airwallex customer created: ${cust.id}`);
    return cust.id;
  }

  // 409 = already exists — retrieve by merchant_customer_id
  if (createRes.status === 409) {
    const listRes = await fetch(
      `${baseUrl}/pa/customers?merchant_customer_id=${encodeURIComponent(merchantCustomerId)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      const existing = listData.items?.[0];
      if (existing?.id) {
        console.log(`[RSFSOFT] Airwallex customer retrieved (existing): ${existing.id}`);
        return existing.id;
      }
    }
  }

  // Non-blocking — if customer creation fails for any reason, continue without it
  const errText = await createRes.text().catch(() => '');
  console.warn(`[RSFSOFT] Airwallex customer upsert failed (${createRes.status}): ${errText}. Proceeding without customer_id.`);
  return null;
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin']  = origin;
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  } else {
    headers['Access-Control-Allow-Origin'] = 'https://rsfsoft.co.uk';
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      amount, currency, invoiceRef,
      clientName, customerEmail, customerMobile,
      services, billingStructure
    } = body;

    // Validation
    if (!body.checkOnly && (!amount || !currency || !invoiceRef)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: amount, currency, invoiceRef' })
      };
    }

    const clientId     = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey       = process.env.AIRWALLEX_API_KEY;
    const airwallexEnv = process.env.AIRWALLEX_ENV || 'demo';

    // No credentials → mock mode
    if (!clientId || !apiKey) {
      console.warn('[RSFSOFT] Airwallex API credentials missing. Using mock mode.');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          mock: true,
          env: 'demo',
          id: `intent_${crypto.randomBytes(12).toString('hex')}`,
          client_secret: `mock_secret_${crypto.randomBytes(32).toString('hex')}`
        })
      };
    }

    // Health check only (no payment intent created)
    if (body.checkOnly) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ mock: false, env: airwallexEnv })
      };
    }

    const baseUrl = airwallexEnv === 'prod'
      ? 'https://api.airwallex.com/api/v1'
      : 'https://api-demo.airwallex.com/api/v1';

    // ── Step 1: Authenticate ───────────────────────────────────────────────────
    const authRes = await fetch(`${baseUrl}/authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId.trim(),
        'x-api-key':   apiKey.trim()
      }
    });

    if (!authRes.ok) {
      const authErrorText = await authRes.text();
      console.error(`[RSFSOFT] Airwallex auth FAILED (HTTP ${authRes.status}):`, authErrorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: `Payment gateway authentication failed (HTTP ${authRes.status}). Verify your AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY match the AIRWALLEX_ENV setting (prod vs demo).`,
          detail: authErrorText.slice(0, 400)
        })
      };
    }

    const { token } = await authRes.json();

    // ── Step 2: Create / Retrieve Customer record in Airwallex portal ──────────
    // This makes the customer appear in Airwallex → Customers section with name + email
    const customerId = await upsertCustomer(baseUrl, token, {
      clientName, customerEmail, customerMobile, invoiceRef
    });

    // ── Step 3: Build the Payment Intent payload ───────────────────────────────
    const amountNum   = parseFloat(amount);
    const isRecurring = billingStructure === 'Recurring Subscription';

    const intentPayload = {
      request_id:        crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      amount:            amountNum,
      currency:          currency.toUpperCase(),
      merchant_order_id: invoiceRef,          // Appears as Order Reference in portal
      descriptor:        'RSFSOFT LTD',       // Appears on customer bank statement

      // ── Customer linkage (makes customer appear in Airwallex Customers tab) ──
      ...(customerId && { customer_id: customerId }),

      // ── Recurring: payment_method_options (only when subscription selected) ──
      // Uses correct Airwallex field name 'mechanism' (not 'trigger')
      ...(isRecurring && {
        payment_method_options: {
          card: {
            recurring: {
              mechanism:         'scheduled',   // Merchant-initiated future charges
              next_triggered_by: 'merchant',
              currency:          currency.toUpperCase()
            }
          }
        }
      }),

      // ── Metadata (searchable in portal, visible in payment detail view) ──────
      // NOTE: 'order.products' was removed — that field belongs to Airwallex's
      // /pa/orders endpoint, NOT /pa/payment_intents/create. Including it caused
      // a 400 validation error from Airwallex. Line-item info lives in metadata.
      metadata: {
        rsfsoft_invoice_ref:    invoiceRef,
        rsfsoft_client_name:    clientName       || '',
        rsfsoft_customer_email: customerEmail    || '',
        rsfsoft_customer_mobile: customerMobile  || '',
        rsfsoft_services:       services         || '',
        rsfsoft_billing_type:   billingStructure || 'One-Time Payment',
        rsfsoft_source:         'payments.rsfsoft.co.uk'
      }
    };

    // ── Step 4: Create Payment Intent ─────────────────────────────────────────
    console.log(`[RSFSOFT] Creating payment intent: ${amountNum} ${currency} | ref: ${invoiceRef} | recurring: ${isRecurring}`);
    const intentRes = await fetch(`${baseUrl}/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(intentPayload)
    });

    if (!intentRes.ok) {
      const intentError = await intentRes.json().catch(() => ({}));
      console.error(`[RSFSOFT] Payment Intent FAILED (HTTP ${intentRes.status}):`, JSON.stringify(intentError));
      return {
        statusCode: intentRes.status,
        headers,
        body: JSON.stringify({
          error: intentError.message || intentError.error || `Airwallex rejected the payment intent (HTTP ${intentRes.status})`,
          detail: intentError
        })
      };
    }

    const intentData = await intentRes.json();
    console.log(`[RSFSOFT] Payment intent created: ${intentData.id} | customer: ${customerId || 'none'} | order: ${invoiceRef}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mock:          false,
        env:           airwallexEnv,
        id:            intentData.id,
        client_secret: intentData.client_secret,
        customer_id:   customerId || null       // Returned for confirmation logging
      })
    };

  } catch (err) {
    console.error('[RSFSOFT] Error in create-airwallex-intent:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

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

// ─────────────────────────────────────────────────────────────────────────────
// AIRWALLEX BILLING API — creates data in Billing → Customers / Invoices /
// Subscriptions sections of the Airwallex portal.
//
// This is a SEPARATE system from Payment Intents.
// Payment Intents → appear under Payments → Payment Intents
// Billing records  → appear under Billing → Customers / Invoices / Subscriptions
//
// By calling both APIs, every customer payment appears in BOTH sections.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create or retrieve a Billing Customer in Airwallex.
 * These appear under Billing → Customers in your Airwallex portal.
 * Endpoint: POST /api/v1/billing_customers/create
 */
async function upsertBillingCustomer(baseUrl, token, { clientName, customerEmail, customerMobile, billingType }) {
  try {
    const payload = {
      request_id:   crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      name:         clientName    || 'Unknown Client',
      type:         'INDIVIDUAL',                        // INDIVIDUAL or BUSINESS
      ...(customerEmail  && { email:        customerEmail  }),
      ...(customerMobile && { phone_number: customerMobile })
    };

    const res = await fetch(`${baseUrl}/billing_customers/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[RSFSOFT] ✅ Billing Customer created → ID: ${data.id} | Name: ${clientName} | ${billingType}`);
      return data.id;
    }

    const errBody = await res.text().catch(() => '');
    console.warn(`[RSFSOFT] Billing Customer create failed (${res.status}): ${errBody}`);
    return null;
  } catch (e) {
    console.warn(`[RSFSOFT] Billing Customer exception: ${e.message}`);
    return null;
  }
}

/**
 * Create a Billing Invoice in Airwallex for one-time payments.
 * These appear under Billing → Invoices in your Airwallex portal.
 *
 * We use collection_method: 'OUT_OF_BAND' because we already collected the
 * payment via our Card Element (Payment Intent). This records the invoice as
 * a completed transaction in the Billing section.
 *
 * Endpoint: POST /api/v1/invoices/create
 */
async function createBillingInvoice(baseUrl, token, {
  billingCustomerId, currency, amountNum, invoiceRef, services, clientName, paymentIntentId
}) {
  if (!billingCustomerId) return null;
  try {
    const payload = {
      request_id:         crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      billing_customer_id: billingCustomerId,
      currency:           currency.toUpperCase(),
      // OUT_OF_BAND = payment was collected via another method (our card element)
      // This marks the invoice as a record of the payment, not a new payment request.
      collection_method:  'OUT_OF_BAND',
      description:        `${services || 'Digital Marketing Services'} — Invoice ${invoiceRef} — Client: ${clientName}`,
      line_items: [
        {
          // Inline line item without requiring a pre-created Price object
          description: services || 'Digital Marketing Services',
          unit_amount: amountNum,   // Already in minor units (pence/cents)
          quantity:    1
        }
      ],
      // Link this invoice to the Payment Intent for audit trail
      ...(paymentIntentId && {
        metadata: {
          payment_intent_id:   paymentIntentId,
          rsfsoft_invoice_ref: invoiceRef,
          rsfsoft_client:      clientName
        }
      })
    };

    const res = await fetch(`${baseUrl}/invoices/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[RSFSOFT] ✅ Billing Invoice created → ID: ${data.id} | Status: ${data.status} | Amount: ${amountNum / 100} ${currency}`);
      return data.id;
    }

    const errBody = await res.text().catch(() => '');
    console.warn(`[RSFSOFT] Billing Invoice create failed (${res.status}): ${errBody}`);
    return null;
  } catch (e) {
    console.warn(`[RSFSOFT] Billing Invoice exception: ${e.message}`);
    return null;
  }
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
    // ── CRITICAL: Airwallex requires amount in MINOR UNITS (pence / cents) ───────
    // £500.00 → 50000 pence  |  $299.99 → 29999 cents  |  €150 → 15000 cents
    // Sending the raw decimal (500) means Airwallex charges 500 pence = £5.00 !!!
    // All supported currencies (GBP, USD, EUR, CAD, AUD, AED) use factor 100.
    const amountNum   = Math.round(parseFloat(amount) * 100); // e.g. 500 → 50000
    const isRecurring = billingStructure === 'Recurring Subscription';

    const intentPayload = {
      request_id:        crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      amount:            amountNum,
      currency:          currency.toUpperCase(),
      merchant_order_id: invoiceRef,          // Appears as "Order Reference" in Airwallex portal
      descriptor:        'RSFSOFT LTD',       // Appears on customer bank statement
      capture_method:    'AUTOMATIC',         // Capture immediately when authorised

      // ── 3DS Redirect Support ───────────────────────────────────────────────
      // Some banks (especially non-UK) use redirect-based 3DS instead of in-iframe.
      // return_url tells Airwallex where to send the customer after bank authentication.
      return_url:        'https://www.rsfsoft.co.uk/payments',

      // ── Customer linkage (makes customer appear in Airwallex Customers tab) ──
      ...(customerId && { customer_id: customerId }),

      // ── Recurring: payment_method_options (only when subscription selected) ──
      // Sets up the payment method for future merchant-initiated charges.
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

      // ── Metadata — appears in Airwallex portal payment detail view ───────────
      // Every field here is searchable and visible in your Airwallex dashboard.
      metadata: {
        rsfsoft_invoice_ref:     invoiceRef,
        rsfsoft_client_name:     clientName       || '',
        rsfsoft_customer_email:  customerEmail    || '',
        rsfsoft_customer_mobile: customerMobile   || '',
        rsfsoft_services:        services         || '',
        rsfsoft_billing_type:    billingStructure || 'One-Time Payment',
        rsfsoft_source:          'rsfsoft.co.uk/payments',
        rsfsoft_customer_id:     customerId       || 'not-linked'
      }
    };

    // ── Step 4: Create Payment Intent ─────────────────────────────────────────
    console.log(`[RSFSOFT] Creating payment intent: ${amountNum} minor-units (${parseFloat(amount).toFixed(2)} ${currency}) | ref: ${invoiceRef} | recurring: ${isRecurring} | customer: ${customerId || 'none'}`);
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

    // Log the intent ID clearly — visible in Netlify function logs for 24h
    console.log(`[RSFSOFT] ✅ PAYMENT INTENT CREATED SUCCESSFULLY`);
    console.log(`[RSFSOFT]    Intent ID:    ${intentData.id}`);
    console.log(`[RSFSOFT]    Amount:       ${parseFloat(amount).toFixed(2)} ${currency} (${amountNum} minor units)`);
    console.log(`[RSFSOFT]    Invoice Ref:  ${invoiceRef}`);
    console.log(`[RSFSOFT]    Client:       ${clientName} <${customerEmail}>`);
    console.log(`[RSFSOFT]    Customer ID:  ${customerId || 'not-linked'}`);
    console.log(`[RSFSOFT]    Recurring:    ${isRecurring}`);
    console.log(`[RSFSOFT]    View in Airwallex: https://www.airwallex.com/app/payments/${intentData.id}`);

    // ── Step 5: Create Airwallex BILLING records (non-blocking) ───────────────
    // This populates the Billing → Customers and Billing → Invoices sections
    // in your Airwallex portal. Runs in background — does NOT affect payment.
    //
    // The user asked: "why can't I see Faizan Khan / Fartashia Khan in Billing?"
    // Answer: Payment Intents appear in Payments section. Billing records appear
    // in Billing section. We create BOTH so the data shows everywhere.
    //
    // NOTE: Billing API calls run concurrently via Promise.allSettled so that
    // a failure in one does NOT block the payment intent response to the frontend.
    Promise.allSettled([
      // 5a. Create Billing Customer → appears in Billing → Customers
      upsertBillingCustomer(baseUrl, token, {
        clientName,
        customerEmail,
        customerMobile,
        billingType: billingStructure
      }).then(billingCustId => {
        if (!billingCustId) return;

        if (!isRecurring) {
          // 5b. One-time: create Billing Invoice → appears in Billing → Invoices
          return createBillingInvoice(baseUrl, token, {
            billingCustomerId: billingCustId,
            currency,
            amountNum,
            invoiceRef,
            services,
            clientName,
            paymentIntentId: intentData.id
          });
        } else {
          // 5c. Subscription: billing customer created above.
          // Full subscription creation requires a Product + Price object in Airwallex
          // Billing → Product Catalogue. Once you create those in the portal, we can
          // create subscriptions automatically. For now, the customer appears in
          // Billing → Customers and the payment intent handles the first charge.
          console.log(`[RSFSOFT] Subscription billing customer created. Manual subscription creation recommended in Airwallex portal.`);
          console.log(`[RSFSOFT]    Go to: Billing → Subscriptions → New Subscription → Select customer: ${clientName}`);
        }
      })
    ]).catch(e => console.warn('[RSFSOFT] Billing API parallel error:', e.message));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mock:          false,
        env:           airwallexEnv,
        id:            intentData.id,
        client_secret: intentData.client_secret,
        customer_id:   customerId || null,
        invoice_ref:   invoiceRef              // Returned for receipt display
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

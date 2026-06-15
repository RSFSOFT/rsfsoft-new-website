const crypto = require('crypto');

const ALLOWED_ORIGINS = [
  'https://www.rsfsoft.co.uk',
  'https://rsfsoft.co.uk',
  'https://rsfsoft-new-website.netlify.app',
  'http://localhost:8888',
  'http://localhost:3000',
  'http://localhost:5173'
];

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  } else {
    headers['Access-Control-Allow-Origin'] = 'https://rsfsoft.co.uk';
  }

  // Handle preflight OPTIONS request
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
    const { amount, currency, invoiceRef, clientName, customerEmail, customerMobile, services } = body;

    // Validation
    if (!amount || !currency || !invoiceRef) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: amount, currency, invoiceRef' })
      };
    }

    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;
    const airwallexEnv = process.env.AIRWALLEX_ENV || 'demo'; // default to demo/sandbox

    // Check if credentials are present, else fallback to mock mode
    if (!clientId || !apiKey) {
      console.warn('Airwallex API credentials not found in environment variables. Falling back to mock simulation.');
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

    // Set base URLs depending on environment
    const baseUrl = airwallexEnv === 'prod' 
      ? 'https://api.airwallex.com/api/v1' 
      : 'https://api-demo.airwallex.com/api/v1';

    // 1. Authenticate with Airwallex
    const authRes = await fetch(`${baseUrl}/authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId.trim(),
        'x-api-key': apiKey.trim()
      }
    });

    if (!authRes.ok) {
      const authError = await authRes.text();
      console.error('Airwallex authentication failed:', authError);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Payment gateway authentication failed' })
      };
    }

    const authData = await authRes.json();
    const token = authData.token;

    // 2. Create Payment Intent
    const intentRes = await fetch(`${baseUrl}/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        request_id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        merchant_order_id: invoiceRef,
        descriptor: 'RSFSOFT LTD',
        metadata: {
          clientName: clientName || '',
          invoiceRef: invoiceRef,
          customerEmail: customerEmail || '',
          customerMobile: customerMobile || '',
          services: services || ''
        }
      })
    });

    if (!intentRes.ok) {
      const intentError = await intentRes.json();
      console.error('Airwallex Payment Intent creation failed:', intentError);
      return {
        statusCode: intentRes.status,
        headers,
        body: JSON.stringify({ error: intentError.message || 'Failed to create payment intent' })
      };
    }

    const intentData = await intentRes.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mock: false,
        env: airwallexEnv,
        id: intentData.id,
        client_secret: intentData.client_secret
      })
    };

  } catch (err) {
    console.error('Error in create-airwallex-intent function:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

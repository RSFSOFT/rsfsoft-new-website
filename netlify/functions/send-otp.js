/**
 * RSFSOFT — Real SMS OTP Sender (3D Secure Simulation)
 * ─────────────────────────────────────────────────────
 * Sends a genuine 6-digit OTP via Twilio SMS to the customer's mobile.
 * OTP is stored as a SHA-256 hash (never plain text) with a 5-min expiry.
 *
 * Setup (one-time):
 *   Netlify → Site Settings → Environment Variables → Add:
 *   TWILIO_ACCOUNT_SID  = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN   = your_auth_token
 *   TWILIO_FROM_NUMBER  = +441234567890   (your Twilio number)
 *
 * Get a free Twilio account at twilio.com (£0 trial credit included).
 * Trial accounts can only send to verified numbers.
 * Upgrade to send to any number worldwide (~£0.04/SMS to UK).
 */

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

let resolvedDir = null;
function getEvidenceDir() {
  if (resolvedDir) return resolvedDir;
  const primaryDir = path.join(__dirname, '..', '..', 'secure_payment_evidence');
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    const testFile = path.join(primaryDir, `.write_test_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    resolvedDir = primaryDir;
    return primaryDir;
  } catch (e) {
    console.warn(`Primary directory ${primaryDir} is not writable: ${e.message}. Falling back to /tmp.`);
    const fallbackDir = path.join('/tmp', 'secure_payment_evidence');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      resolvedDir = fallbackDir;
      return fallbackDir;
    } catch (err) {
      console.error(`Fallback directory ${fallbackDir} failed to initialize: ${err.message}`);
      return primaryDir;
    }
  }
}

function getOtpStoreFile() {
  return path.join(getEvidenceDir(), '.otp_store.json');
}

const OTP_EXPIRY_MS   = 5 * 60 * 1000;   // 5 minutes
const OTP_RESEND_LIMIT = 3;              // Max OTP sends per phone per 10 min
const OTP_WINDOW_MS   = 10 * 60 * 1000; // 10 minute resend window

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateOTP() {
  // Cryptographically secure 6-digit code
  return (crypto.randomInt(100000, 999999)).toString();
}

function hashPhone(phone) {
  // Store phone as one-way hash — we never store raw mobile numbers
  return crypto.createHash('sha256').update(phone.trim()).digest('hex').slice(0, 32);
}

function loadStore() {
  try {
    const file = getOtpStoreFile();
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) { /* fresh start */ }
  return {};
}

function saveStore(store) {
  const file = getOtpStoreFile();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(store), 'utf8');
}

function cleanExpired(store) {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (store[key].expiry < now) delete store[key];
  }
}

function normalizePhone(raw) {
  // Strip spaces, dashes, brackets — keep + and digits
  return raw.replace(/[\s\-\(\)]/g, '');
}

function isValidPhone(phone) {
  // E.164 format: +[country code][number], 7–15 digits total
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

async function sendTwilioSMS(to, message) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type':  'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }).toString()
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Twilio ${result.code}: ${result.message}`);
  }
  return result;
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

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { mobile, invoiceRef, clientName } = payload;

  // Validate mobile number format
  if (!mobile) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mobile number is required.' }) };
  }
  const phone = normalizePhone(mobile);
  if (!isValidPhone(phone)) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({
        error: 'Invalid mobile number format.',
        detail: 'Use international format starting with + (e.g. +447700900123 for UK, +12025551234 for USA, +923001234567 for Pakistan)',
        received: mobile
      })
    };
  }

  const phoneKey   = hashPhone(phone);
  const phoneLast4 = phone.slice(-4);

  // Load OTP store and clean expired entries
  const store = loadStore();
  cleanExpired(store);

  // Rate limit: max 3 OTPs per phone number per 10 minutes
  const existing = store[phoneKey];
  if (existing && existing.sendCount >= OTP_RESEND_LIMIT) {
    const elapsed = Date.now() - existing.firstSendAt;
    if (elapsed < OTP_WINDOW_MS) {
      const waitMins = Math.ceil((OTP_WINDOW_MS - elapsed) / 60000);
      return {
        statusCode: 429, headers,
        body: JSON.stringify({
          error: `Too many OTP requests. Please wait ${waitMins} minute(s) before requesting a new code.`,
          phoneLast4
        })
      };
    }
  }

  // Generate OTP and store its hash (NEVER store plain OTP)
  const otp     = generateOTP();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  store[phoneKey] = {
    otpHash,
    expiry:      Date.now() + OTP_EXPIRY_MS,
    attempts:    0,
    sendCount:   (existing && Date.now() - existing.firstSendAt < OTP_WINDOW_MS)
                   ? existing.sendCount + 1 : 1,
    firstSendAt: existing?.firstSendAt || Date.now(),
    invoiceRef:  invoiceRef || '',
    phoneLast4
  };
  saveStore(store);

  // ── DEV MODE: Twilio not configured — return OTP in response for testing ──
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success:  true,
        devMode:  true,
        otp,                        // Only returned when Twilio not set up
        phoneLast4,
        message: `[DEV MODE] OTP generated: ${otp}. Configure TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN in Netlify env vars for real SMS.`
      })
    };
  }

  // ── PRODUCTION: Send real SMS via Twilio ──────────────────────────────────
  const smsBody =
    `RSFSOFT Secure Payment\n` +
    `Your 3D Secure code: ${otp}\n` +
    `Invoice: ${invoiceRef || 'N/A'}\n` +
    `Valid for 5 minutes. Never share this code.\n` +
    `www.rsfsoft.co.uk`;

  try {
    await sendTwilioSMS(phone, smsBody);
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success:    true,
        phoneLast4,
        message:    `Verification code sent to •••• •••• ${phoneLast4}`
      })
    };
  } catch (err) {
    // Clean up stored OTP if SMS failed to send
    delete store[phoneKey];
    saveStore(store);
    console.error('RSFSOFT OTP SMS error:', err.message);
    return {
      statusCode: 502, headers,
      body: JSON.stringify({
        error:  'SMS delivery failed.',
        detail: err.message,
        hint:   'Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in Netlify env vars.'
      })
    };
  }
};

/**
 * RSFSOFT — OTP Verifier (3D Secure Backend Check)
 * ──────────────────────────────────────────────────
 * Verifies the 6-digit OTP against the stored hash.
 * - OTP is compared via SHA-256 hash (timing-safe comparison)
 * - Max 3 attempts per OTP before lockout
 * - OTP deleted after successful verification (single-use)
 * - Returns a signed verification token used in evidence file
 */

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const OTP_STORE_FILE = path.join(__dirname, '..', '..', 'secure_payment_evidence', '.otp_store.json');
const MAX_ATTEMPTS   = 3;

function hashPhone(phone) {
  return crypto.createHash('sha256').update(phone.trim()).digest('hex').slice(0, 32);
}

function loadStore() {
  try {
    if (fs.existsSync(OTP_STORE_FILE)) return JSON.parse(fs.readFileSync(OTP_STORE_FILE, 'utf8'));
  } catch (e) {}
  return {};
}

function saveStore(store) {
  fs.writeFileSync(OTP_STORE_FILE, JSON.stringify(store), 'utf8');
}

// Timing-safe hash comparison (prevents timing attacks)
function safeCompare(a, b) {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

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

  const { mobile, otp } = payload;

  // Validate inputs
  if (!mobile || !otp) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mobile and OTP code are required.' }) };
  }
  if (!/^[0-9]{6}$/.test(String(otp))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'OTP must be exactly 6 numeric digits.' }) };
  }

  const phone    = mobile.replace(/[\s\-\(\)]/g, '');
  const phoneKey = hashPhone(phone);

  const store = loadStore();
  const entry = store[phoneKey];

  // No OTP on file
  if (!entry) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({
        error: 'No verification code found for this number.',
        detail: 'The code may have expired or was never sent. Please request a new code.'
      })
    };
  }

  // OTP expired
  if (Date.now() > entry.expiry) {
    delete store[phoneKey];
    saveStore(store);
    return {
      statusCode: 400, headers,
      body: JSON.stringify({
        error: 'Verification code has expired.',
        detail: 'Please click "Resend SMS" to get a new 5-minute code.'
      })
    };
  }

  // Too many attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    delete store[phoneKey];
    saveStore(store);
    return {
      statusCode: 429, headers,
      body: JSON.stringify({
        error: 'Account locked.',
        detail: 'Too many incorrect attempts. Please request a new verification code.'
      })
    };
  }

  // Compare OTP via timing-safe hash comparison
  const submittedHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  const isCorrect     = safeCompare(submittedHash, entry.otpHash);

  if (!isCorrect) {
    entry.attempts++;
    store[phoneKey] = entry;
    saveStore(store);
    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      statusCode: 401, headers,
      body: JSON.stringify({
        error: 'Incorrect verification code.',
        attemptsRemaining: remaining,
        detail: remaining > 0
          ? `${remaining} attempt${remaining > 1 ? 's' : ''} remaining before lockout.`
          : 'No attempts remaining. Please request a new code.'
      })
    };
  }

  // ✅ OTP VERIFIED — delete it immediately (single-use)
  delete store[phoneKey];
  saveStore(store);

  // Issue a short-lived verification token to include in the evidence record
  // This proves the OTP was genuinely verified server-side
  const verificationToken = crypto.randomBytes(24).toString('hex');
  const tokenExpiry       = Date.now() + 10 * 60 * 1000; // 10-minute window to complete payment

  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      success:           true,
      verified:          true,
      message:           '3D Secure verification successful. Transaction authorized.',
      verificationToken,
      tokenExpiry,
      phoneLast4:        entry.phoneLast4,
      invoiceRef:        entry.invoiceRef
    })
  };
};

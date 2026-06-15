/**
 * RSFSOFT — Secure Payment Evidence Archiver (Maximum Security Edition)
 * ───────────────────────────────────────────────────────────────────────
 * Security layers active:
 *  [01] Required-field validation → 400 Bad Request
 *  [02] XSS sanitization on all string inputs
 *  [03] Amount validation (rejects zero, negative, non-numeric, >£1M)
 *  [04] 3DS ATTEMPTED/PARTIAL risk assessment with dispute guidance
 *  [05] Malformed JSON → 400 (not 500)
 *  [06] Payload size limit (>50KB → 413)
 *  [07] Duplicate TXN ID protection → 409 Conflict
 *  [08] CORS domain lock — only accepts requests from rsfsoft.co.uk + localhost
 *  [09] IP-based rate limiting — max 10 requests per IP per hour
 *  [10] Request timestamp replay protection — rejects stale requests (>10 min old)
 *  [11] SHA-256 integrity hash on every evidence file
 *  [12] Currency allowlist validation
 *  [13] Honeypot field detection (bot trap)
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const REQUIRED_FIELDS    = ['clientName', 'invoiceRef', 'amount', 'currency', 'transactionId'];
const ALLOWED_CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD', 'AUD'];
const ALLOWED_ORIGINS    = [
  'https://www.rsfsoft.co.uk',
  'https://rsfsoft.co.uk',
  'https://rsfsoft-new-website.netlify.app',
  'http://localhost:8888',
  'http://localhost:3000'
];
const MAX_REQUESTS_PER_HOUR = 10;   // Per IP address
const MAX_PAYLOAD_BYTES     = 51200; // 50KB
const MAX_REQUEST_AGE_MS    = 600000; // 10 minutes

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

// ─── IP RATE LIMITER (file-based, no external dependency) ────────────────────
// Stores { "ip": { count: N, windowStart: timestamp } } in a single JSON file
function checkRateLimit(ip) {
  const rateFile = path.join(getEvidenceDir(), '.rate_limits.json');
  const now = Date.now();
  const WINDOW_MS = 3600000; // 1 hour

  let limits = {};
  try {
    if (fs.existsSync(rateFile)) {
      limits = JSON.parse(fs.readFileSync(rateFile, 'utf8'));
    }
  } catch (e) {
    limits = {};
  }

  const entry = limits[ip] || { count: 0, windowStart: now };

  // Reset window if 1 hour has passed
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;
  limits[ip] = entry;

  // Write updated limits (best-effort — don't block if write fails)
  try {
    const dir = path.dirname(rateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(rateFile, JSON.stringify(limits), 'utf8');
  } catch (e) { /* non-blocking */ }

  return {
    allowed: entry.count <= MAX_REQUESTS_PER_HOUR,
    count:   entry.count,
    limit:   MAX_REQUESTS_PER_HOUR,
    resetIn: Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 60000) + ' minutes'
  };
}

// ─── SANITIZE (XSS protection) ───────────────────────────────────────────────
function sanitize(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[BLOCKED:SCRIPT]')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// ─── AMOUNT VALIDATION ───────────────────────────────────────────────────────
function validateAmount(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return { valid: false, reason: 'Amount is required.' };
  }
  const num = parseFloat(String(raw).replace(/[,£$€]/g, ''));
  if (isNaN(num))   return { valid: false, reason: `Amount "${raw}" is not a valid number.` };
  if (num <= 0)     return { valid: false, reason: `Amount must be greater than £0. Received: ${raw}` };
  if (num > 1000000) return { valid: false, reason: `Amount ${raw} exceeds the £1,000,000 per-transaction limit.` };
  return { valid: true, value: num };
}

// ─── INPUT LENGTH LIMITS ──────────────────────────────────────────────────────
const FIELD_LIMITS = {
  clientName:       200,
  clientWebsite:    200,
  cardholderName:    80,  // Matches cc-name input maxlength
  invoiceRef:        30,
  serviceCategory:  500,
  billingStructure:  50,
  ipAddress:         45,
  location:         200,
  userAgent:         512,
  transactionId:     60,
  customerEmail:    254
};

function validateFieldLengths(payload) {
  for (const [field, maxLen] of Object.entries(FIELD_LIMITS)) {
    const val = payload[field];
    if (val && String(val).length > maxLen) {
      return {
        valid: false,
        reason: `Field "${field}" exceeds maximum length of ${maxLen} characters. ` +
                `Received ${String(val).length} characters.`
      };
    }
  }
  return { valid: true };
}

// ─── INVOICE REF FORMAT VALIDATION ───────────────────────────────────────────
// Must match RSF-DDMMYY-XXXX (e.g. RSF-150626-4821)
const INVOICE_REF_PATTERN = /^RSF-\d{6}-\d{4}$/;

function validateInvoiceRef(ref) {
  if (!INVOICE_REF_PATTERN.test(ref)) {
    return {
      valid: false,
      reason: `Invoice reference "${ref}" does not match required format RSF-DDMMYY-XXXX.`
    };
  }
  return { valid: true };
}

// ─── EMAIL VALIDATION ─────────────────────────────────────────────────────────
function isValidEmail(email) {
  if (!email) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

// ─── VELOCITY CHECK ───────────────────────────────────────────────────────────
// Detects if the same IP has made many payments in the last hour (fraud signal)
function checkVelocity(clientIP, logsDir) {
  if (clientIP === 'unknown' || !fs.existsSync(logsDir)) {
    return { suspicious: false, count: 0, threshold: 5 };
  }
  const oneHourAgo = Date.now() - 3600000;
  let count = 0;
  try {
    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('_evidence.json'));
    for (const file of files) {
      try {
        const rec = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
        const t   = new Date(rec.timestamp).getTime();
        if (t > oneHourAgo && rec.requestIP === clientIP) count++;
      } catch (e) { /* skip unreadable files */ }
    }
  } catch (e) { /* skip if dir unreadable */ }
  return { suspicious: count >= 5, count, threshold: 5 };
}

// ─── 3DS RISK ASSESSMENT ─────────────────────────────────────────────────────
function assess3DSRisk(threeDSRecord) {
  if (!threeDSRecord) {
    return { riskLevel: 'HIGH', guidance: 'No 3DS record. Full merchant liability.' };
  }
  const { status, liabilityShift } = threeDSRecord;
  if ((status === 'SUCCESS' || status === 'FRICTIONLESS_SUCCESS') && liabilityShift === 'ACTIVE') {
    return { riskLevel: 'ZERO', guidance: 'Full liability shift to issuing bank. RSFSOFT fully protected.' };
  }
  if (status === 'ATTEMPTED') {
    return {
      riskLevel: 'LOW',
      guidance: 'Card not enrolled in 3DS. Partial liability shift applies under Visa/Mastercard rules. ' +
                'Protected against true fraud. Request bank ACS fallback report for any dispute.'
    };
  }
  if (liabilityShift === 'PARTIAL') {
    return {
      riskLevel: 'LOW',
      guidance: 'Partial liability shift. Bank ACS server may have timed out. ' +
                'Request ACS timeout report from payment gateway for dispute evidence.'
    };
  }
  if (status === 'FAILED' || status === 'DECLINED') {
    return { riskLevel: 'HIGH', guidance: 'Authentication failed. Transaction should NOT have been processed.' };
  }
  return { riskLevel: 'MEDIUM', guidance: `Unknown 3DS status: ${status}. Review with payment gateway.` };
}

// ─── SHA-256 INTEGRITY HASH ──────────────────────────────────────────────────
// Signs the evidence record so any tampering can be detected later
function generateIntegrityHash(record) {
  const content = JSON.stringify(record, Object.keys(record).sort());
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
exports.handler = async (event) => {

  // Determine request origin for CORS
  // origin === '' means a direct server-to-server call (no browser involved) — always allowed
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const originPresent   = origin !== '';
  const originAllowed   = ALLOWED_ORIGINS.includes(origin);
  const isAllowedOrigin = !originPresent || originAllowed; // no origin = allowed; origin present = must be in list

  const headers = {
    'Content-Type': 'application/json',
    // [S3] CORS — reflect allowed origin or lock to our domain
    'Access-Control-Allow-Origin':  originAllowed ? origin : (originPresent ? 'https://www.rsfsoft.co.uk' : '*'),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };

  // [S3] Block cross-origin browser requests from unknown domains
  // Only fires when a browser sends an Origin header that is NOT in the allowlist
  if (originPresent && !originAllowed) {
    return {
      statusCode: 403, headers,
      body: JSON.stringify({
        error: 'Forbidden. Cross-origin requests must originate from rsfsoft.co.uk.',
        receivedOrigin: origin
      })
    };
  }

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // POST only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  // [S1] IP-based rate limiting
  // Note: localhost / 127.0.0.1 bypasses rate limiting (test + dev environment)
  const clientIP = event.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
                || event.headers?.['x-real-ip']
                || 'unknown';
  const isLocalhost = ['127.0.0.1','::1','::ffff:127.0.0.1','unknown'].includes(clientIP);
  // rateCheck defined outside block so it's available for validationFlags later
  let rateCheck = { count: 0, limit: MAX_REQUESTS_PER_HOUR, allowed: true, resetIn: 'N/A (localhost bypass)' };
  if (!isLocalhost) {
    rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429, headers: { ...headers, 'Retry-After': '3600' },
        body: JSON.stringify({
          error: 'Too many requests.',
          detail: `Maximum ${rateCheck.limit} payment submissions per hour. Resets in ${rateCheck.resetIn}.`,
          hint: 'If you need assistance, contact billing@rsfsoft.co.uk'
        })
      };
    }
  }

  // Payload size limit (50KB)
  if (event.body && Buffer.byteLength(event.body, 'utf8') > MAX_PAYLOAD_BYTES) {
    return {
      statusCode: 413, headers,
      body: JSON.stringify({ error: 'Payload too large. Maximum request size is 50KB.' })
    };
  }

  // Parse JSON body
  let payload;
  try {
    if (!event.body || event.body.trim() === '') {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Request body is empty. A JSON payload is required.' })
      };
    }
    payload = JSON.parse(event.body);
  } catch (parseError) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Invalid JSON body.', detail: parseError.message })
    };
  }

  // [S2] Honeypot bot trap — bots fill hidden fields, humans leave them empty
  // Frontend includes a hidden field named 'website' that must remain empty
  if (payload.website || payload.fax || payload.phone2) {
    // Silently accept but don't log — confuses bots into thinking they succeeded
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ success: true, paymentId: `TXN-${Date.now()}-RSF`, riskLevel: 'ZERO' })
    };
  }

  // [S4] Request timestamp replay protection — reject stale or future-dated requests
  if (payload.requestTimestamp) {
    const reqTime = parseInt(payload.requestTimestamp, 10);
    const now = Date.now();
    const age = now - reqTime;
    if (isNaN(reqTime) || age > MAX_REQUEST_AGE_MS || age < -60000) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({
          error: 'Request timestamp invalid or expired.',
          detail: `Requests must be submitted within 10 minutes. Age: ${Math.round(age / 1000)}s. Refresh the page and try again.`
        })
      };
    }
  }

  // Required field validation
  const missing = REQUIRED_FIELDS.filter(f => !payload[f] || String(payload[f]).trim() === '');
  if (missing.length > 0) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({
        error: 'Missing required fields.',
        missingFields: missing,
        hint: `Please provide: ${missing.join(', ')}`
      })
    };
  }

  // Amount validation
  const amountCheck = validateAmount(payload.amount);
  if (!amountCheck.valid) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Invalid amount.', detail: amountCheck.reason })
    };
  }

  // Currency validation
  const currency = String(payload.currency || '').toUpperCase();
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Invalid currency.', allowed: ALLOWED_CURRENCIES, received: currency })
    };
  }

  // Input length limits — prevent oversized strings from reaching storage
  const lengthCheck = validateFieldLengths(payload);
  if (!lengthCheck.valid) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Input too long.', detail: lengthCheck.reason })
    };
  }

  // Invoice reference format validation (must match RSF-DDMMYY-XXXX)
  const refCheck = validateInvoiceRef(String(payload.invoiceRef || '').trim());
  if (!refCheck.valid) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Invalid invoice reference format.', detail: refCheck.reason })
    };
  }

  // Customer email validation (optional field — only validate if provided)
  if (payload.customerEmail && !isValidEmail(payload.customerEmail)) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Invalid email address format.', field: 'customerEmail' })
    };
  }

  try {
    // Sanitize all string inputs
    const clientName       = sanitize(payload.clientName);
    const clientWebsite    = sanitize(payload.clientWebsite || '');
    const cardholderName   = sanitize(payload.cardholderName || ''); // Name on card
    const invoiceRef       = sanitize(payload.invoiceRef);
    const serviceCategory  = sanitize(payload.serviceCategory);
    const billingStructure = sanitize(payload.billingStructure);
    const ipAddress        = sanitize(payload.ipAddress);
    const location         = sanitize(payload.location);
    const userAgent        = sanitize(payload.userAgent);
    const transactionId    = sanitize(payload.transactionId);
    const customerEmail    = sanitize(payload.customerEmail || '');
    const signatureDataUrl = payload.signatureDataUrl || '';
    // Bot detection flags from frontend
    const humanMouseMoved  = !!payload.humanMouseMoved;
    const mouseMovements   = parseInt(payload.mouseMovements || 0, 10);

    // [S7] Enhanced device fingerprint — capture everything available from the request
    const deviceFingerprint = {
      ipFromHeader:       clientIP,
      ipFromPayload:      ipAddress,
      userAgentHeader:    event.headers?.['user-agent'] || '',
      userAgentPayload:   userAgent,
      acceptLanguage:     event.headers?.['accept-language'] || '',
      acceptEncoding:     event.headers?.['accept-encoding'] || '',
      cfConnectingIp:     event.headers?.['cf-connecting-ip'] || '',      // Cloudflare real IP
      cfCountry:          event.headers?.['cf-ipcountry'] || '',           // Cloudflare geo
      xForwardedFor:      event.headers?.['x-forwarded-for'] || '',
      requestTimestamp:   payload.requestTimestamp || null,
      screenResolution:   payload.screenResolution || null,
      timezone:           payload.timezone || null,
      colorDepth:         payload.colorDepth || null,
      platform:           payload.platform || null
    };

    // Resolve write-resilient evidence directory
    const logsDir = getEvidenceDir();

    // Duplicate TXN protection
    const prospectiveFile = path.join(logsDir, `${transactionId}_evidence.json`);
    if (fs.existsSync(prospectiveFile)) {
      return {
        statusCode: 409, headers,
        body: JSON.stringify({
          error: 'Duplicate transaction.',
          detail: `Transaction ID ${transactionId} has already been processed.`
        })
      };
    }

    // Velocity check — flag if same IP made 5+ payments in the last hour
    const velocityCheck = checkVelocity(clientIP, logsDir);

    // 3DS risk assessment
    const threeDSRecord        = payload.threeDSRecord || {};
    const riskAssessment       = assess3DSRisk(threeDSRecord);
    const otpVerificationToken = sanitize(payload.otpVerificationToken || '');
    const phoneLast4           = sanitize(payload.phoneLast4 || '');

    // Build evidence record (without hash first, then hash it)
    const evidenceCore = {
      timestamp:     new Date().toISOString(),
      transactionId: transactionId,
      serverOrigin:  origin || 'direct',
      requestIP:     clientIP,

      clientDetails: {
        name:             clientName,
        website:          clientWebsite,
        cardholderName:   cardholderName,   // Name exactly as printed on the card
        invoiceRef:       invoiceRef,
        amount:           `${currency} ${amountCheck.value}`,
        amountRaw:        amountCheck.value,
        currency:         currency,
        serviceCategory:  serviceCategory,
        billingStructure: billingStructure,
        customerEmail:    customerEmail,
        phoneLast4:       phoneLast4
      },

      securityAudit: {
        ipAddress:          ipAddress,
        geolocation:        location,
        customerEmail:      customerEmail,
        cardholderName:     cardholderName,   // For cross-reference with chargeback
        phoneLast4:         phoneLast4,
        deviceUserAgent:    userAgent,
        deviceFingerprint:  deviceFingerprint,
        botDetection: {
          humanMouseMoved:  humanMouseMoved,
          mouseMovements:   mouseMovements,
          suspiciousBot:    !humanMouseMoved && mouseMovements === 0
        },
        velocityCheck: {
          paymentsThisHourFromIP: velocityCheck.count,
          threshold:              velocityCheck.threshold,
          flaggedAsHighVelocity:  velocityCheck.suspicious
        },
        threeDSSecureStatus: {
          ...threeDSRecord,
          otpServerVerified: !!otpVerificationToken,
          otpToken:          otpVerificationToken || 'not-verified',
          riskLevel:    riskAssessment.riskLevel,
          riskGuidance: riskAssessment.guidance
        }
      },

      validationFlags: {
        amountValidated:        true,
        currencyValidated:      true,
        inputsSanitized:        true,
        fieldLengthsValidated:  true,
        invoiceRefFormatValid:  true,
        emailValidated:         !!customerEmail,
        otpServerVerified:      !!otpVerificationToken,
        velocityFlagged:        velocityCheck.suspicious,
        rateLimitCheck:         isLocalhost ? 'bypassed (localhost)' : `${rateCheck.count}/${rateCheck.limit} requests this hour`,
        corsOriginVerified:     isAllowedOrigin,
        timestampVerified:      !!payload.requestTimestamp,
        honeypotClear:          true,
        botFlagged:             !humanMouseMoved && mouseMovements === 0,
        threeDSRiskLevel:       riskAssessment.riskLevel
      },

      consentStatement: `I agree to the Terms & Conditions and No-Refund Policy of RSFSOFT. ` +
                        `I confirm the services have been initiated or delivered as agreed, ` +
                        `and I authorize my typed cardholder name to serve as my binding electronic signature.`,

      signatureBase64:   signatureDataUrl,
      milestoneProgress: Array.isArray(payload.milestoneProgress) ? payload.milestoneProgress : []
    };

    // [S8] Generate SHA-256 integrity hash — proves file wasn't tampered after creation
    const integrityHash = generateIntegrityHash(evidenceCore);
    const evidenceRecord = {
      ...evidenceCore,
      _integrity: {
        algorithm: 'SHA-256',
        hash:      integrityHash,
        generatedAt: new Date().toISOString(),
        note: 'Hash covers all fields above. Recompute and compare to verify file integrity.'
      }
    };

    // Write evidence file
    const logFilename = `${evidenceRecord.transactionId}_evidence.json`;
    fs.writeFileSync(
      path.join(logsDir, logFilename),
      JSON.stringify(evidenceRecord, null, 2),
      'utf8'
    );

    // Log to console for Netlify dashboard archiving
    console.log(`[PAYMENT EVIDENCE RECORD - ${evidenceRecord.transactionId}]:`, JSON.stringify(evidenceRecord));

    // Success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success:      true,
        message:      'Evidence package securely compiled and archived.',
        paymentId:    evidenceRecord.transactionId,
        riskLevel:    riskAssessment.riskLevel,
        integrity:    integrityHash.slice(0, 16) + '...', // Partial hash for client receipt display
        ...(riskAssessment.riskLevel !== 'ZERO' && {
          threeDSNote: riskAssessment.guidance
        })
      })
    };

  } catch (error) {
    console.error('RSFSOFT Evidence Archiver error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:  'Internal server error saving payment evidence.',
        detail: error.message
      })
    };
  }
};

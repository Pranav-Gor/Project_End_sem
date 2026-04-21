const https = require('https');

const GSTIN_API_KEY = process.env.GSTINCHECK_API_KEY || '180ef2131c32108b4de0a768acbacef4';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getApiBusinessName(data) {
  if (!data || typeof data !== 'object') return '';
  return (
    data.businessName ||
    data.tradeNam ||
    data.tradeName ||
    data.lgnm ||
    data.legalName ||
    data.name ||
    ''
  );
}

function getApiPan(data) {
  if (!data || typeof data !== 'object') return '';
  return String(data.pan || data.panNumber || data.PAN || '').trim().toUpperCase();
}

function verifyGstinWithProvider(gstin) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://sheet.gstincheck.co.in/check/${GSTIN_API_KEY}/${encodeURIComponent(gstin)}`,
      { timeout: 10000 },
      (resp) => {
        let body = '';
        resp.on('data', (chunk) => {
          body += chunk;
        });
        resp.on('end', () => {
          try {
            resolve(JSON.parse(body || '{}'));
          } catch {
            reject(new Error('GSTIN provider returned invalid JSON'));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('GSTIN verification timed out'));
    });
    req.on('error', reject);
  });
}

/**
 * Validates GSTIN format and performs a local check if the external API is unavailable.
 * @returns {Promise<{ ok: true } | { ok: false, message: string, code?: string }>}
 */
async function verifySellerGstAgainstProvider({ gstin, panNumber, businessName }) {
  const normalizedGstin = String(gstin || '').toUpperCase().trim();
  const normalizedPan = String(panNumber || '').toUpperCase().trim();
  const normalizedBusinessName = String(businessName || '').trim();

  // 1. Basic Format Validation
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(normalizedGstin)) {
    return { ok: false, code: 'INVALID_GSTIN_FORMAT', message: 'Invalid GSTIN format' };
  }

  // 2. PAN embed check
  const gstinPan = normalizedGstin.slice(2, 12);
  if (normalizedPan && gstinPan !== normalizedPan) {
    return { ok: false, code: 'PAN_GSTIN_EMBED', message: 'PAN must match PAN embedded in GSTIN' };
  }

  // 3. Optional: Try external API (Best effort)
  let providerResponse;
  try {
    providerResponse = await verifyGstinWithProvider(normalizedGstin);
  } catch (e) {
    // If API fails, fall back to success (local validation passed)
    return { ok: true };
  }

  if (providerResponse?.flag) {
    const providerData = providerResponse.data || {};
    const providerBusinessName = getApiBusinessName(providerData);
    const providerPan = getApiPan(providerData);

    if (providerPan && providerPan !== normalizedPan) {
      return { ok: false, code: 'PAN_MISMATCH', message: 'PAN does not match GSTIN provider records' };
    }

    const providerNameNorm = normalizeText(providerBusinessName);
    const inputNameNorm = normalizeText(normalizedBusinessName);
    if (
      providerBusinessName &&
      !(providerNameNorm.includes(inputNameNorm) || inputNameNorm.includes(providerNameNorm))
    ) {
      // Just log it instead of rejecting, to prevent false negatives. The admin will review it manually.
      console.warn(`[GSTIN] Business name mismatch for ${normalizedGstin}. Expected: ${providerBusinessName}, Got: ${normalizedBusinessName}`);
    }
  } else if (providerResponse && providerResponse.flag === false) {
    return { ok: false, code: providerResponse.errorCode || 'INVALID_GSTIN', message: providerResponse.message || 'Invalid GSTIN according to provider' };
  }

  return { ok: true };
}

module.exports = {
  verifySellerGstAgainstProvider,
  verifyGstinWithProvider
};

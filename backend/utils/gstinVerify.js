const https = require('https');

const GSTIN_API_KEY = process.env.GSTINCHECK_API_KEY || 'baab89c40dee3992b66904b565fff5c3';

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
 * Calls GSTIN provider and ensures GSTIN + PAN + business name match provider data.
 * @returns {Promise<{ ok: true } | { ok: false, message: string, code?: string }>}
 */
async function verifySellerGstAgainstProvider({ gstin, panNumber, businessName }) {
  const normalizedGstin = String(gstin).toUpperCase().trim();
  const normalizedPan = String(panNumber).toUpperCase().trim();
  const normalizedBusinessName = String(businessName || '').trim();

  let providerResponse;
  try {
    providerResponse = await verifyGstinWithProvider(normalizedGstin);
  } catch (e) {
    if (e?.message === 'GSTIN verification timed out') {
      return {
        ok: false,
        code: 'GSTIN_TIMEOUT',
        message: 'GSTIN verification timed out. Please try again.'
      };
    }
    return {
      ok: false,
      code: 'GSTIN_PROVIDER_ERROR',
      message: 'GSTIN verification failed'
    };
  }

  const providerData = providerResponse?.data || {};
  if (!providerResponse?.flag) {
    return {
      ok: false,
      code: providerResponse?.errorCode || 'GSTIN_INVALID',
      message: providerResponse?.message || 'GSTIN verification failed'
    };
  }

  const providerBusinessName = getApiBusinessName(providerData);
  const providerPan = getApiPan(providerData);
  const gstinPan = normalizedGstin.slice(2, 12);

  if (providerPan && providerPan !== normalizedPan) {
    return {
      ok: false,
      code: 'PAN_MISMATCH',
      message: 'PAN does not match GSTIN provider records'
    };
  }
  if (gstinPan !== normalizedPan) {
    return {
      ok: false,
      code: 'PAN_GSTIN_EMBED',
      message: 'PAN must match PAN embedded in GSTIN'
    };
  }
  if (
    !providerBusinessName ||
    normalizeText(providerBusinessName) !== normalizeText(normalizedBusinessName)
  ) {
    return {
      ok: false,
      code: 'BUSINESS_NAME_MISMATCH',
      message: 'Business name does not match GSTIN provider records'
    };
  }

  return { ok: true };
}

module.exports = {
  verifySellerGstAgainstProvider,
  verifyGstinWithProvider
};

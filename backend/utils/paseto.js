const { V4 } = require('paseto');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * PASETO v4 in this package uses Ed25519 *public* tokens (sign with private key, verify with public).
 * A raw hex "symmetric" secret is invalid — that caused "invalid key provided".
 */
let privateKey;
let publicKey;

function loadOrCreateEd25519Keys() {
  const envPem = process.env.PASETO_PRIVATE_KEY;
  if (envPem && envPem.trim()) {
    const normalized = envPem.replace(/\\n/g, '\n').trim();
    try {
      privateKey = crypto.createPrivateKey(normalized);
      publicKey = crypto.createPublicKey(privateKey);
      if (privateKey.asymmetricKeyType !== 'ed25519') {
        throw new Error('PASETO_PRIVATE_KEY must be an Ed25519 PKCS8 PEM key');
      }
      return;
    } catch (e) {
      console.error('Invalid PASETO_PRIVATE_KEY:', e.message);
      process.exit(1);
    }
  }

  const keyFile = path.join(__dirname, '..', '.paseto-ed25519.pem');
  try {
    if (fs.existsSync(keyFile)) {
      const pem = fs.readFileSync(keyFile, 'utf8');
      privateKey = crypto.createPrivateKey(pem);
      publicKey = crypto.createPublicKey(privateKey);
      console.log(`PASETO: loaded Ed25519 key from ${keyFile}`);
      return;
    }
  } catch (e) {
    console.warn('PASETO: could not read key file:', e.message);
  }

  const { privateKey: pkPem } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });

  try {
    fs.writeFileSync(keyFile, pkPem, { mode: 0o600 });
    console.warn(`PASETO: generated new Ed25519 key → ${keyFile}`);
    console.warn('      For production, set PASETO_PRIVATE_KEY in .env (PEM, use \\n for newlines).');
  } catch (e) {
    console.warn('PASETO: could not write key file (tokens reset on restart):', e.message);
  }

  privateKey = crypto.createPrivateKey(pkPem);
  publicKey = crypto.createPublicKey(privateKey);
}

loadOrCreateEd25519Keys();

const generateAccessToken = async (payload) => {
  const seconds = parseInt(process.env.ACCESS_TOKEN_EXPIRY, 10) || 3600;
  try {
    // paseto v4 requires iat/exp as ISO8601 strings; library adds them via options.
    return await V4.sign(
      { ...payload, type: 'access' },
      privateKey,
      { expiresIn: `${seconds}s` }
    );
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
};

const generateRefreshToken = async (payload) => {
  const seconds = parseInt(process.env.REFRESH_TOKEN_EXPIRY, 10) || 604800;
  try {
    return await V4.sign(
      { ...payload, type: 'refresh' },
      privateKey,
      { expiresIn: `${seconds}s` }
    );
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error.message}`);
  }
};

const verifyToken = async (token) => {
  try {
    return await V4.verify(token, publicKey);
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('expired')) {
      throw new Error('Token has expired');
    }
    throw new Error('Invalid token');
  }
};

const decodeToken = async (token) => {
  try {
    return await V4.verify(token, publicKey);
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

const generateTokenPair = async (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken({ userId: user._id.toString() })
  ]);

  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generateTokenPair
};

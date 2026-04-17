/**
 * Writes backend/.paseto-ed25519.pem — same file the server auto-creates if PASETO_PRIVATE_KEY is unset.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keyFile = path.join(__dirname, '..', '.paseto-ed25519.pem');
const { privateKey } = crypto.generateKeyPairSync('ed25519', {
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

fs.writeFileSync(keyFile, privateKey, { mode: 0o600 });
console.log('Wrote', keyFile);
console.log('\nOr add to .env as PASETO_PRIVATE_KEY (escape newlines as \\n):');
console.log(JSON.stringify(privateKey.trimEnd()));

const crypto = require('crypto');

const HOSTS = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

function plaidEnv() {
  const env = process.env.PLAID_ENV || 'sandbox';
  if (!HOSTS[env]) throw new Error('PLAID_ENV must be sandbox, development, or production');
  if (env === 'production' && process.env.ALLOW_PLAID_PRODUCTION !== 'true') {
    throw new Error('Plaid production is locked until authentication and persistent token storage are configured');
  }
  return env;
}

async function plaidRequest(path, body) {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error('Plaid credentials are not configured');
  }
  const response = await fetch(HOSTS[plaidEnv()] + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error_message || 'Plaid request failed');
    error.status = response.status;
    error.plaid = data;
    throw error;
  }
  return data;
}

function encryptionKey() {
  const value = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  if (!value) throw new Error('PLAID_TOKEN_ENCRYPTION_KEY is not configured');
  return crypto.createHash('sha256').update(value).digest();
}

function seal(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function open(value) {
  const packed = Buffer.from(value, 'base64url');
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const encrypted = packed.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function cookie(name, value, maxAge = 60 * 60 * 24 * 30) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function sendError(res, error) {
  console.error('[plaid]', error.plaid || error);
  const configurationError = /not configured|PLAID_ENV/.test(error.message);
  res.status(configurationError ? 503 : (error.status || 500)).json({
    error: configurationError ? error.message : 'Unable to connect to the financial provider',
    code: error.plaid?.error_code,
  });
}

module.exports = { plaidEnv, plaidRequest, seal, open, cookies, cookie, sendError };

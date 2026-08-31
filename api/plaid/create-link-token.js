const crypto = require('crypto');
const { plaidEnv, plaidRequest, cookies, cookie, sendError } = require('../../lib/plaid');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const current = cookies(req);
    const sessionId = current.creddual_session || crypto.randomUUID();
    const request = {
      client_name: 'Creddual',
      language: 'en',
      country_codes: ['US'],
      products: ['transactions'],
      user: { client_user_id: sessionId },
    };
    if (process.env.PLAID_WEBHOOK_URL) request.webhook = process.env.PLAID_WEBHOOK_URL;
    const result = await plaidRequest('/link/token/create', request);
    res.setHeader('Set-Cookie', cookie('creddual_session', sessionId));
    res.status(200).json({ link_token: result.link_token, environment: plaidEnv() });
  } catch (error) {
    sendError(res, error);
  }
};

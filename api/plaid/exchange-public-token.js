const { plaidEnv, plaidRequest, seal, cookie, sendError } = require('../../lib/plaid');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!req.body?.public_token) return res.status(400).json({ error: 'public_token is required' });
    const exchanged = await plaidRequest('/item/public_token/exchange', {
      public_token: req.body.public_token,
    });
    const accountsResult = await plaidRequest('/accounts/get', {
      access_token: exchanged.access_token,
    });
    const safeAccounts = accountsResult.accounts.map(account => ({
      id: account.account_id,
      name: account.name,
      officialName: account.official_name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
    }));
    const token = seal({
      accessToken: exchanged.access_token,
      itemId: exchanged.item_id,
      cursor: null,
    });
    res.setHeader('Set-Cookie', cookie('creddual_plaid', token));
    res.status(200).json({ connected: true, environment: plaidEnv(), accounts: safeAccounts });
  } catch (error) {
    sendError(res, error);
  }
};

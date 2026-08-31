const { cookie } = require('../../lib/plaid');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Set-Cookie', cookie('creddual_plaid', '', 0));
  res.status(200).json({ connected: false });
};

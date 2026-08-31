const { plaidRequest, seal, open, cookies, cookie, sendError } = require('../../lib/plaid');

function rewardMerchants() {
  return (process.env.REWARD_MERCHANTS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const stored = cookies(req).creddual_plaid;
    if (!stored) return res.status(401).json({ error: 'No linked account' });
    const item = open(stored);
    let cursor = item.cursor || null;
    let hasMore = true;
    const added = [];
    const modified = [];
    const removed = [];

    while (hasMore) {
      const page = await plaidRequest('/transactions/sync', {
        access_token: item.accessToken,
        cursor,
        count: 100,
      });
      added.push(...page.added);
      modified.push(...page.modified);
      removed.push(...page.removed);
      cursor = page.next_cursor;
      hasMore = page.has_more;
    }

    const partners = rewardMerchants();
    const transactions = [...added, ...modified].map(transaction => {
      const merchant = (transaction.merchant_name || transaction.name || '').toLowerCase();
      const rewardEligible = transaction.amount > 0 && partners.some(partner => merchant.includes(partner));
      return {
        id: transaction.transaction_id,
        date: transaction.authorized_date || transaction.date,
        merchant: transaction.merchant_name || transaction.name,
        amount: transaction.amount,
        pending: transaction.pending,
        rewardEligible,
      };
    });

    res.setHeader('Set-Cookie', cookie('creddual_plaid', seal({ ...item, cursor })));
    res.status(200).json({
      syncing: transactions.length === 0 && !cursor,
      transactions,
      rewardMatches: transactions.filter(transaction => transaction.rewardEligible),
      removed: removed.map(transaction => transaction.transaction_id),
    });
  } catch (error) {
    sendError(res, error);
  }
};

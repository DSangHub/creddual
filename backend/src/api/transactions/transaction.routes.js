// backend/src/api/transactions/transaction.routes.js
// Transaction history for the signed-in consumer or merchant.

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError } = require('../../lib/http');
const { authMiddleware, roleGuard } = require('../../middleware/auth');

router.use(authMiddleware, roleGuard('CONSUMER', 'MERCHANT'));

const include = {
  product: { select: { id: true, name: true, category: true } },
  merchant: { select: { id: true, businessName: true } },
  consumer: { select: { id: true, user: { select: { firstName: true, lastName: true } } } }
};

// Limits every query to the caller's own transactions.
const ownerFilter = async (user) => {
  if (user.role === 'CONSUMER') {
    const consumer = await prisma.consumer.findUnique({ where: { userId: user.id } });
    if (!consumer) throw new HttpError(404, 'Consumer profile not found');
    return { consumerId: consumer.id };
  }
  const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
  if (!merchant) throw new HttpError(404, 'Merchant not found');
  return { merchantId: merchant.id };
};

// List own transactions. Optional ?status=, ?limit=, ?offset=
router.get('/', asyncHandler(async (req, res) => {
  const owner = await ownerFilter(req.user);
  const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
  if (status && !['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
    throw new HttpError(400, 'status must be PENDING, COMPLETED or FAILED');
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const where = { ...owner, ...(status && { status }) };
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
    prisma.transaction.count({ where })
  ]);

  res.json({ total, limit, offset, transactions });
}));

// Get one of own transactions
router.get('/:id', asyncHandler(async (req, res) => {
  const owner = await ownerFilter(req.user);

  const transaction = await prisma.transaction.findFirst({
    where: { id: req.params.id, ...owner },
    include
  });
  if (!transaction) throw new HttpError(404, 'Transaction not found');

  res.json(transaction);
}));

module.exports = router;

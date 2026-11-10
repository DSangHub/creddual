// backend/src/api/consumers/consumer.routes.js

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError } = require('../../lib/http');
const { authMiddleware, roleGuard } = require('../../middleware/auth');

router.use(authMiddleware, roleGuard('CONSUMER'));

const merchantSummary = {
  select: {
    id: true,
    businessName: true,
    businessType: true,
    city: true,
    state: true,
    isVerified: true,
    user: { select: { firstName: true, lastName: true } }
  }
};

const round2 = (value) => Math.round(value * 100) / 100;

const getConsumer = async (userId) => {
  const consumer = await prisma.consumer.findUnique({ where: { userId } });
  if (!consumer) throw new HttpError(404, 'Consumer profile not found');
  return consumer;
};

// Get consumer profile
router.get('/profile', asyncHandler(async (req, res) => {
  const consumer = await prisma.consumer.findUnique({
    where: { userId: req.user.id },
    include: {
      user: { select: { email: true, firstName: true, lastName: true, phone: true } },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { product: true, merchant: merchantSummary }
      },
      rewardClaims: { where: { status: 'PENDING' } }
    }
  });

  if (!consumer) throw new HttpError(404, 'Consumer profile not found');

  // Check reward eligibility
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const spendSince = (since) =>
    prisma.transaction.aggregate({
      where: { consumerId: consumer.id, status: 'COMPLETED', createdAt: { gte: since } },
      _sum: { amount: true }
    });

  const [weekly, monthly] = await Promise.all([spendSince(weekStart), spendSince(monthStart)]);
  const weeklySpend = weekly._sum.amount || 0;
  const monthlySpend = monthly._sum.amount || 0;

  res.json({
    ...consumer,
    weeklySpend,
    monthlySpend,
    rewardsEligible: weeklySpend >= consumer.minWeeklySpend && monthlySpend >= consumer.minMonthlySpend
  });
}));

// Link debit card
router.post('/link-debit', asyncHandler(async (req, res) => {
  const { debitCardLast4, bankAccountId, linkedBank } = req.body || {};

  if (!/^\d{4}$/.test(String(debitCardLast4 || ''))) {
    throw new HttpError(400, 'debitCardLast4 must be the last 4 digits of the card');
  }

  await getConsumer(req.user.id);
  const consumer = await prisma.consumer.update({
    where: { userId: req.user.id },
    data: {
      debitCardLast4: String(debitCardLast4),
      bankAccountId: bankAccountId ? String(bankAccountId) : null,
      linkedBank: linkedBank ? String(linkedBank) : null
    }
  });

  res.json({ message: 'Debit card linked successfully', consumer });
}));

// Get available products
router.get('/products', asyncHandler(async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

  const products = await prisma.product.findMany({
    where: {
      inventory: { gt: 0 },
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: { merchant: merchantSummary },
    orderBy: { createdAt: 'desc' }
  });

  res.json(products);
}));

// Purchase product
router.post('/purchase', asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  if (typeof productId !== 'string' || !productId) throw new HttpError(400, 'productId is required');

  const consumer = await getConsumer(req.user.id);

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError(400, 'Product not available');

    // Reserve one unit; the inventory check and decrement happen in a single
    // statement so two simultaneous buyers can't both take the last item.
    const reserved = await tx.product.updateMany({
      where: { id: productId, inventory: { gt: 0 } },
      data: { inventory: { decrement: 1 } }
    });
    if (reserved.count === 0) throw new HttpError(400, 'Product not available');

    // The price always comes from the catalogue, never from the request body.
    const amount = product.discountedPrice ?? product.originalPrice;
    const rewardEarned = round2((amount * product.rewardPercentage) / 100);

    const transaction = await tx.transaction.create({
      data: {
        consumerId: consumer.id,
        merchantId: product.merchantId,
        productId: product.id,
        amount,
        rewardEarned,
        transactionType: 'DEBIT',
        status: 'COMPLETED',
        referenceId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      }
    });

    const updatedConsumer = await tx.consumer.update({
      where: { id: consumer.id },
      data: { totalRewards: { increment: rewardEarned } }
    });

    await tx.merchant.update({
      where: { id: product.merchantId },
      data: { totalSales: { increment: amount }, totalRewardsGiven: { increment: rewardEarned } }
    });

    await tx.rewardClaim.create({
      data: {
        consumerId: consumer.id,
        amount: rewardEarned,
        rewardType: 'POINTS',
        description: `Reward for purchase of ${product.name}`
      }
    });

    await tx.rewardHistory.create({
      data: {
        consumerId: consumer.id,
        merchantId: product.merchantId,
        amount: rewardEarned,
        action: 'EARNED',
        description: `Earned ${rewardEarned} points from ${product.name} purchase`
      }
    });

    return { transaction, rewardEarned, totalRewards: updatedConsumer.totalRewards };
  });

  res.json({ message: 'Purchase successful', ...result });
}));

// Get available banks for account opening
router.get('/partner-banks', asyncHandler(async (req, res) => {
  const banks = await prisma.financialInstitution.findMany({
    where: { isActive: true },
    select: {
      id: true,
      institutionName: true,
      institutionType: true,
      address: true,
      city: true,
      state: true,
      zipCode: true
    },
    orderBy: { institutionName: 'asc' }
  });

  res.json(banks);
}));

// Referral to partner bank
router.post('/refer-bank', asyncHandler(async (req, res) => {
  const { fiId } = req.body || {};
  if (typeof fiId !== 'string' || !fiId) throw new HttpError(400, 'fiId is required');

  const consumer = await getConsumer(req.user.id);

  const fi = await prisma.financialInstitution.findFirst({ where: { id: fiId, isActive: true } });
  if (!fi) throw new HttpError(404, 'Partner bank not found');

  const open = await prisma.partnerBankReferral.findFirst({
    where: { fiId, consumerId: consumer.id, status: { in: ['PENDING', 'APPROVED'] } }
  });
  if (open) throw new HttpError(409, 'You already have an open referral with this bank');

  const referral = await prisma.partnerBankReferral.create({
    data: { fiId, consumerId: consumer.id, referralFee: fi.referralFee }
  });

  res.json({ message: 'Bank referral submitted', referral });
}));

module.exports = router;

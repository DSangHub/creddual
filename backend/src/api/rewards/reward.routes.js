// backend/src/api/rewards/reward.routes.js
// A consumer's reward balance, claims and history.

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError } = require('../../lib/http');
const { authMiddleware, roleGuard } = require('../../middleware/auth');

router.use(authMiddleware, roleGuard('CONSUMER'));

const getConsumer = async (userId) => {
  const consumer = await prisma.consumer.findUnique({ where: { userId } });
  if (!consumer) throw new HttpError(404, 'Consumer profile not found');
  return consumer;
};

// Reward summary: balance plus claims
router.get('/', asyncHandler(async (req, res) => {
  const consumer = await getConsumer(req.user.id);

  const claims = await prisma.rewardClaim.findMany({
    where: { consumerId: consumer.id },
    orderBy: { createdAt: 'desc' }
  });

  const sum = (status) =>
    claims.filter((claim) => claim.status === status).reduce((total, claim) => total + claim.amount, 0);

  res.json({
    totalRewards: consumer.totalRewards,
    pendingAmount: sum('PENDING'),
    redeemedAmount: sum('REDEEMED'),
    claims
  });
}));

// Reward history (earned / redeemed / expired)
router.get('/history', asyncHandler(async (req, res) => {
  const consumer = await getConsumer(req.user.id);

  const history = await prisma.rewardHistory.findMany({
    where: { consumerId: consumer.id },
    include: { merchant: { select: { id: true, businessName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  res.json(history);
}));

// Redeem a pending reward claim
router.post('/claims/:id/redeem', asyncHandler(async (req, res) => {
  const consumer = await getConsumer(req.user.id);

  const claim = await prisma.rewardClaim.findFirst({
    where: { id: req.params.id, consumerId: consumer.id }
  });
  if (!claim) throw new HttpError(404, 'Reward claim not found');
  if (claim.status === 'REDEEMED') throw new HttpError(409, 'Reward already redeemed');
  if (claim.expiresAt && claim.expiresAt < new Date()) throw new HttpError(400, 'Reward has expired');

  const result = await prisma.$transaction(async (tx) => {
    // Conditional update so the same claim can't be redeemed twice.
    const changed = await tx.rewardClaim.updateMany({
      where: { id: claim.id, status: claim.status },
      data: { status: 'REDEEMED', claimedAt: new Date() }
    });
    if (changed.count === 0) throw new HttpError(409, 'Reward already redeemed');

    const updatedConsumer = await tx.consumer.update({
      where: { id: consumer.id },
      data: { totalRewards: { decrement: claim.amount } }
    });

    await tx.rewardHistory.create({
      data: {
        consumerId: consumer.id,
        amount: claim.amount,
        action: 'REDEEMED',
        description: claim.description ? `Redeemed: ${claim.description}` : 'Reward redeemed'
      }
    });

    return {
      claim: await tx.rewardClaim.findUnique({ where: { id: claim.id } }),
      totalRewards: updatedConsumer.totalRewards
    };
  });

  res.json({ message: 'Reward redeemed', ...result });
}));

module.exports = router;

// backend/src/api/financial-institutions/fi.routes.js

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError, pick, toNumber } = require('../../lib/http');
const { authMiddleware, roleGuard } = require('../../middleware/auth');

router.use(authMiddleware, roleGuard('FI'));

const referralConsumer = (extraUserFields = {}) => ({
  consumer: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true, ...extraUserFields } }
    }
  }
});

// Allowed status moves. COMPLETED is final so revenue is only counted once.
const NEXT_STATUSES = {
  PENDING: ['APPROVED', 'COMPLETED'],
  APPROVED: ['COMPLETED'],
  COMPLETED: []
};

const getFi = async (userId, include) => {
  const fi = await prisma.financialInstitution.findUnique({ where: { userId }, include });
  if (!fi) throw new HttpError(404, 'Financial institution not found');
  return fi;
};

// Get FI dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Bank account numbers are deliberately not returned here.
  const fi = await getFi(req.user.id, { _count: { select: { bankAccounts: true } } });

  const referrals = await prisma.partnerBankReferral.findMany({
    where: { fiId: fi.id },
    include: referralConsumer(),
    orderBy: { createdAt: 'desc' }
  });

  const completedReferrals = referrals.filter((r) => r.status === 'COMPLETED');

  res.json({
    fi,
    stats: {
      totalReferrals: referrals.length,
      completedReferrals: completedReferrals.length,
      pendingReferrals: referrals.filter((r) => r.status === 'PENDING').length,
      totalRevenue: completedReferrals.reduce((sum, r) => sum + r.referralFee, 0)
    },
    referrals
  });
}));

// Update referral status (FI approves account opening)
router.put('/referrals/:id', asyncHandler(async (req, res) => {
  const referralId = req.params.id;
  const status = req.body?.status;

  if (!['APPROVED', 'COMPLETED'].includes(status)) {
    throw new HttpError(400, 'status must be APPROVED or COMPLETED');
  }

  const referral = await prisma.partnerBankReferral.findFirst({
    where: { id: referralId, fi: { userId: req.user.id } }
  });
  if (!referral) throw new HttpError(404, 'Referral not found');

  if (!(NEXT_STATUSES[referral.status] || []).includes(status)) {
    throw new HttpError(409, `Referral is already ${referral.status}`);
  }

  const updatedReferral = await prisma.$transaction(async (tx) => {
    // Conditional on the status we just read, so two concurrent requests
    // can't both complete the referral and double-count the fee.
    const changed = await tx.partnerBankReferral.updateMany({
      where: { id: referralId, status: referral.status },
      data: { status, ...(status === 'COMPLETED' && { completedAt: new Date() }) }
    });
    if (changed.count === 0) throw new HttpError(409, 'Referral was updated by another request');

    if (status === 'COMPLETED') {
      await tx.financialInstitution.update({
        where: { id: referral.fiId },
        data: { totalReferrals: { increment: 1 }, totalRevenue: { increment: referral.referralFee } }
      });
    }

    return tx.partnerBankReferral.findUnique({ where: { id: referralId } });
  });

  res.json({ message: 'Referral updated successfully', referral: updatedReferral });
}));

// Get all referrals for FI
router.get('/referrals', asyncHandler(async (req, res) => {
  const fi = await getFi(req.user.id);

  const referrals = await prisma.partnerBankReferral.findMany({
    where: { fiId: fi.id },
    include: referralConsumer({ phone: true }),
    orderBy: { createdAt: 'desc' }
  });

  res.json(referrals);
}));

// Update FI profile
router.put('/profile', asyncHandler(async (req, res) => {
  await getFi(req.user.id);

  // Only these fields are editable; totals, userId and ids are not.
  const data = pick(req.body, [
    'institutionName',
    'institutionType',
    'routingNumber',
    'address',
    'city',
    'state',
    'zipCode'
  ]);
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string' || (!value.trim() && key !== 'routingNumber')) {
      throw new HttpError(400, `${key} must be text`);
    }
    data[key] = value.trim();
  }
  if (data.routingNumber === '') data.routingNumber = null;

  if (req.body?.referralFee !== undefined) {
    const fee = toNumber(req.body.referralFee);
    if (fee === undefined || fee < 0) throw new HttpError(400, 'referralFee must be 0 or more');
    data.referralFee = fee;
  }
  if (req.body?.isActive !== undefined) data.isActive = Boolean(req.body.isActive);

  const fi = await prisma.financialInstitution.update({ where: { userId: req.user.id }, data });

  res.json({ message: 'Profile updated successfully', fi });
}));

module.exports = router;

// backend/src/api/financial-institutions/fi.routes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, roleGuard } = require('../../middleware/auth');

// Get FI dashboard
router.get('/dashboard', authMiddleware, roleGuard('FI'), async (req, res) => {
  try {
    const fi = await prisma.financialInstitution.findUnique({
      where: { userId: req.user.id },
      include: {
        bankAccounts: true
      }
    });
    
    if (!fi) {
      return res.status(404).json({ message: 'Financial institution not found' });
    }
    
    const referrals = await prisma.partnerBankReferral.findMany({
      where: { fiId: fi.id },
      include: {
        consumer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const completedReferrals = referrals.filter(r => r.status === 'COMPLETED');
    const totalReferrals = await prisma.partnerBankReferral.count({
      where: { fiId: fi.id }
    });
    
    res.json({
      fi,
      stats: {
        totalReferrals,
        completedReferrals: completedReferrals.length,
        pendingReferrals: referrals.filter(r => r.status === 'PENDING').length,
        totalRevenue: completedReferrals.reduce((sum, r) => sum + r.referralFee, 0)
      },
      referrals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update referral status (FI approves account opening)
router.put('/referrals/:id', authMiddleware, roleGuard('FI'), async (req, res) => {
  try {
    const referralId = req.params.id;
    const { status } = req.body; // APPROVED, COMPLETED
    
    const referral = await prisma.partnerBankReferral.findFirst({
      where: {
        id: referralId,
        fi: { userId: req.user.id }
      }
    });
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }
    
    const updatedReferral = await prisma.partnerBankReferral.update({
      where: { id: referralId },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      }
    });
    
    // If completed, update FI revenue
    if (status === 'COMPLETED') {
      await prisma.financialInstitution.update({
        where: { id: referral.fiId },
        data: {
          totalReferrals: { increment: 1 },
          totalRevenue: { increment: referral.referralFee }
        }
      });
    }
    
    res.json({
      message: 'Referral updated successfully',
      referral: updatedReferral
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all referrals for FI
router.get('/referrals', authMiddleware, roleGuard('FI'), async (req, res) => {
  try {
    const fi = await prisma.financialInstitution.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!fi) {
      return res.status(404).json({ message: 'Financial institution not found' });
    }
    
    const referrals = await prisma.partnerBankReferral.findMany({
      where: { fiId: fi.id },
      include: {
        consumer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update FI profile
router.put('/profile', authMiddleware, roleGuard('FI'), async (req, res) => {
  try {
    const updates = req.body;
    
    const fi = await prisma.financialInstitution.update({
      where: { userId: req.user.id },
      data: updates
    });
    
    res.json({
      message: 'Profile updated successfully',
      fi
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

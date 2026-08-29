// backend/src/api/consumers/consumer.routes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, roleGuard } = require('../../middleware/auth');

// Get consumer profile
router.get('/profile', authMiddleware, roleGuard('CONSUMER'), async (req, res) => {
  try {
    const consumer = await prisma.consumer.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            merchant: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        rewardClaims: {
          where: { status: 'PENDING' }
        }
      }
    });
    
    if (!consumer) {
      return res.status(404).json({ message: 'Consumer profile not found' });
    }
    
    // Check reward eligibility
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    const weeklySpend = await prisma.transaction.aggregate({
      where: {
        consumerId: consumer.id,
        status: 'COMPLETED',
        createdAt: { gte: weekStart }
      },
      _sum: { amount: true }
    });
    
    const monthlySpend = await prisma.transaction.aggregate({
      where: {
        consumerId: consumer.id,
        status: 'COMPLETED',
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      },
      _sum: { amount: true }
    });
    
    const rewardsEligible = 
      (weeklySpend._sum.amount || 0) >= consumer.minWeeklySpend &&
      (monthlySpend._sum.amount || 0) >= consumer.minMonthlySpend;
    
    res.json({
      ...consumer,
      weeklySpend: weeklySpend._sum.amount || 0,
      monthlySpend: monthlySpend._sum.amount || 0,
      rewardsEligible
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Link debit card
router.post('/link-debit', authMiddleware, roleGuard('CONSUMER'), async (req, res) => {
  try {
    const { debitCardLast4, bankAccountId, linkedBank } = req.body;
    
    const consumer = await prisma.consumer.update({
      where: { userId: req.user.id },
      data: {
        debitCardLast4,
        bankAccountId,
        linkedBank
      }
    });
    
    res.json({ message: 'Debit card linked successfully', consumer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available products
router.get('/products', authMiddleware, roleGuard('CONSUMER'), async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const whereClause = {
      inventory: { gt: 0 },
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        merchant: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase product
router.post('/purchase', authMiddleware, roleGuard('CONSUMER'), async (req, res) => {
  try {
    const { productId, amount } = req.body;
    
    const consumer = await prisma.consumer.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!consumer) {
      return res.status(404).json({ message: 'Consumer not found' });
    }
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product || product.inventory <= 0) {
      return res.status(400).json({ message: 'Product not available' });
    }
    
    // Calculate reward
    const rewardEarned = (amount * product.rewardPercentage) / 100;
    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        consumerId: consumer.id,
        merchantId: product.merchantId,
        productId: product.id,
        amount,
        rewardEarned,
        transactionType: 'DEBIT',
        referenceId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    });
    
    // Update product inventory
    await prisma.product.update({
      where: { id: productId },
      data: { inventory: product.inventory - 1 }
    });
    
    // Update consumer rewards
    await prisma.consumer.update({
      where: { id: consumer.id },
      data: {
        totalRewards: consumer.totalRewards + rewardEarned
      }
    });
    
    // Create reward claim
    await prisma.rewardClaim.create({
      data: {
        consumerId: consumer.id,
        amount: rewardEarned,
        rewardType: 'POINTS',
        description: `Reward for purchase of ${product.name}`
      }
    });
    
    // Record reward history
    await prisma.rewardHistory.create({
      data: {
        consumerId: consumer.id,
        merchantId: product.merchantId,
        amount: rewardEarned,
        action: 'EARNED',
        description: `Earned ${rewardEarned} points from ${product.name} purchase`
      }
    });
    
    res.json({
      message: 'Purchase successful',
      transaction,
      rewardEarned,
      totalRewards: consumer.totalRewards + rewardEarned
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available banks for account opening
router.get('/partner-banks', authMiddleware, roleGuard('CONSUMER'), async (req, res) => {
  try {
    const banks = await prisma.financialInstitution.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.json(banks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Referral to partner bank
router.post('/refer-bank', authMiddleware, roleGuard('CONSUMER'), async (req, res) => {
  try {
    const { fiId } = req.body;
    
    const consumer = await prisma.consumer.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!consumer) {
      return res.status(404).json({ message: 'Consumer not found' });
    }
    
    const referral = await prisma.partnerBankReferral.create({
      data: {
        fiId,
        consumerId: consumer.id,
        referralFee: 100 // Default fee
      }
    });
    
    res.json({
      message: 'Bank referral submitted',
      referral
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

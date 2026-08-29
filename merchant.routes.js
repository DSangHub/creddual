// backend/src/api/merchants/merchant.routes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, roleGuard } = require('../../middleware/auth');

// Get merchant profile and dashboard
router.get('/dashboard', authMiddleware, roleGuard('MERCHANT'), async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
      include: {
        products: true,
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
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
            },
            product: true
          }
        }
      }
    });
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }
    
    // Calculate sales stats
    const totalTransactions = await prisma.transaction.count({
      where: { merchantId: merchant.id }
    });
    
    const totalRevenue = await prisma.transaction.aggregate({
      where: { merchantId: merchant.id, status: 'COMPLETED' },
      _sum: { amount: true }
    });
    
    const totalRewardsGiven = await prisma.transaction.aggregate({
      where: { merchantId: merchant.id, status: 'COMPLETED' },
      _sum: { rewardEarned: true }
    });
    
    // Slow moving products
    const slowMovingProducts = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        inventory: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' },
      take: 5
    });
    
    res.json({
      merchant,
      stats: {
        totalTransactions,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalRewardsGiven: totalRewardsGiven._sum.rewardEarned || 0
      },
      slowMovingProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add product
router.post('/products', authMiddleware, roleGuard('MERCHANT'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      originalPrice,
      discountedPrice,
      rewardPercentage,
      inventory,
      isSeasonal,
      isDiscontinued,
      isSlowMoving,
      images
    } = req.body;
    
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }
    
    const product = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name,
        description,
        category,
        originalPrice,
        discountedPrice: discountedPrice || originalPrice * 0.9,
        rewardPercentage: rewardPercentage || 5,
        inventory: inventory || 10,
        isSeasonal: isSeasonal || false,
        isDiscontinued: isDiscontinued || false,
        isSlowMoving: isSlowMoving || false,
        images: images || []
      }
    });
    
    res.status(201).json({
      message: 'Product added successfully',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/products/:id', authMiddleware, roleGuard('MERCHANT'), async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;
    
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        merchant: { userId: req.user.id }
      }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updates
    });
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get merchant's products
router.get('/products', authMiddleware, roleGuard('MERCHANT'), async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }
    
    const products = await prisma.product.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory analytics
router.get('/analytics/inventory', authMiddleware, roleGuard('MERCHANT'), async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }
    
    const products = await prisma.product.findMany({
      where: { merchantId: merchant.id }
    });
    
    const totalInventory = products.reduce((sum, p) => sum + p.inventory, 0);
    const slowMoving = products.filter(p => p.isSlowMoving).length;
    const seasonal = products.filter(p => p.isSeasonal).length;
    const discontinued = products.filter(p => p.isDiscontinued).length;
    
    res.json({
      totalProducts: products.length,
      totalInventory,
      slowMoving,
      seasonal,
      discontinued,
      averageRewardPercentage: products.reduce((sum, p) => sum + p.rewardPercentage, 0) / products.length || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

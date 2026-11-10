// backend/src/api/merchants/merchant.routes.js

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError, toNumber } = require('../../lib/http');
const { authMiddleware, roleGuard } = require('../../middleware/auth');

router.use(authMiddleware, roleGuard('MERCHANT'));

const getMerchant = async (userId) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) throw new HttpError(404, 'Merchant not found');
  return merchant;
};

// Validates product fields from a request body. With `partial`, only the
// fields that were sent are checked and returned (used for updates).
const productData = (body = {}, { partial = false } = {}) => {
  const data = {};
  const has = (key) => body[key] !== undefined && body[key] !== null && body[key] !== '';

  for (const key of ['name', 'description', 'category']) {
    if (has(key)) {
      if (typeof body[key] !== 'string' || !body[key].trim()) throw new HttpError(400, `${key} must be text`);
      data[key] = body[key].trim();
    } else if (!partial) {
      throw new HttpError(400, `${key} is required`);
    }
  }

  if (has('originalPrice')) {
    const price = toNumber(body.originalPrice);
    if (price === undefined || price <= 0) throw new HttpError(400, 'originalPrice must be greater than 0');
    data.originalPrice = price;
  } else if (!partial) {
    throw new HttpError(400, 'originalPrice is required');
  }

  if (has('discountedPrice')) {
    const price = toNumber(body.discountedPrice);
    if (price === undefined || price <= 0) throw new HttpError(400, 'discountedPrice must be greater than 0');
    data.discountedPrice = price;
  }

  if (has('rewardPercentage')) {
    const percentage = toNumber(body.rewardPercentage);
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      throw new HttpError(400, 'rewardPercentage must be between 0 and 100');
    }
    data.rewardPercentage = percentage;
  }

  if (has('inventory')) {
    const inventory = toNumber(body.inventory);
    if (!Number.isInteger(inventory) || inventory < 0) {
      throw new HttpError(400, 'inventory must be a whole number of 0 or more');
    }
    data.inventory = inventory;
  }

  for (const key of ['isSeasonal', 'isDiscontinued', 'isSlowMoving']) {
    if (body[key] !== undefined) data[key] = Boolean(body[key]);
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.some((image) => typeof image !== 'string')) {
      throw new HttpError(400, 'images must be a list of URLs');
    }
    data.images = body.images;
  }

  return data;
};

// Get merchant profile and dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId: req.user.id },
    include: {
      products: true,
      transactions: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          consumer: {
            select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } }
          },
          product: true
        }
      }
    }
  });

  if (!merchant) throw new HttpError(404, 'Merchant not found');

  const [totalTransactions, completed, slowMovingProducts] = await Promise.all([
    prisma.transaction.count({ where: { merchantId: merchant.id } }),
    prisma.transaction.aggregate({
      where: { merchantId: merchant.id, status: 'COMPLETED' },
      _sum: { amount: true, rewardEarned: true }
    }),
    prisma.product.findMany({
      where: { merchantId: merchant.id, inventory: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
      take: 5
    })
  ]);

  res.json({
    merchant,
    stats: {
      totalTransactions,
      totalRevenue: completed._sum.amount || 0,
      totalRewardsGiven: completed._sum.rewardEarned || 0
    },
    slowMovingProducts
  });
}));

// Add product
router.post('/products', asyncHandler(async (req, res) => {
  const merchant = await getMerchant(req.user.id);
  const data = productData(req.body);

  if (data.discountedPrice !== undefined && data.discountedPrice > data.originalPrice) {
    throw new HttpError(400, 'discountedPrice cannot be higher than originalPrice');
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      merchantId: merchant.id,
      discountedPrice: data.discountedPrice ?? Math.round(data.originalPrice * 90) / 100,
      rewardPercentage: data.rewardPercentage ?? 5,
      inventory: data.inventory ?? 10,
      images: data.images ?? []
    }
  });

  res.status(201).json({ message: 'Product added successfully', product });
}));

// Update product
router.put('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, merchant: { userId: req.user.id } }
  });
  if (!product) throw new HttpError(404, 'Product not found');

  // Only whitelisted, validated fields are written (never merchantId etc.).
  const data = productData(req.body, { partial: true });

  const originalPrice = data.originalPrice ?? product.originalPrice;
  const discountedPrice = data.discountedPrice ?? product.discountedPrice;
  if (discountedPrice != null && discountedPrice > originalPrice) {
    throw new HttpError(400, 'discountedPrice cannot be higher than originalPrice');
  }

  const updatedProduct = await prisma.product.update({ where: { id: product.id }, data });

  res.json({ message: 'Product updated successfully', product: updatedProduct });
}));

// Get merchant's products
router.get('/products', asyncHandler(async (req, res) => {
  const merchant = await getMerchant(req.user.id);

  const products = await prisma.product.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json(products);
}));

// Get inventory analytics
router.get('/analytics/inventory', asyncHandler(async (req, res) => {
  const merchant = await getMerchant(req.user.id);

  const products = await prisma.product.findMany({ where: { merchantId: merchant.id } });

  const totalReward = products.reduce((sum, p) => sum + p.rewardPercentage, 0);

  res.json({
    totalProducts: products.length,
    totalInventory: products.reduce((sum, p) => sum + p.inventory, 0),
    slowMoving: products.filter((p) => p.isSlowMoving).length,
    seasonal: products.filter((p) => p.isSeasonal).length,
    discontinued: products.filter((p) => p.isDiscontinued).length,
    averageRewardPercentage: products.length ? totalReward / products.length : 0
  });
}));

module.exports = router;

// backend/src/api/products/product.routes.js
// Public, read-only product catalogue (no login required).

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError } = require('../../lib/http');

const merchantSummary = {
  select: { id: true, businessName: true, businessType: true, city: true, state: true, isVerified: true }
};

// List products in stock. Optional ?category=, ?search=, ?merchantId=, ?limit=, ?offset=
router.get('/', asyncHandler(async (req, res) => {
  const str = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
  const category = str(req.query.category);
  const search = str(req.query.search);
  const merchantId = str(req.query.merchantId);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const products = await prisma.product.findMany({
    where: {
      inventory: { gt: 0 },
      isDiscontinued: false,
      ...(category && { category }),
      ...(merchantId && { merchantId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: { merchant: merchantSummary },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  res.json(products);
}));

// List the categories that currently have products in stock
router.get('/categories', asyncHandler(async (req, res) => {
  const rows = await prisma.product.findMany({
    where: { inventory: { gt: 0 }, isDiscontinued: false },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' }
  });

  res.json(rows.map((row) => row.category));
}));

// Get one product
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { merchant: merchantSummary }
  });
  if (!product) throw new HttpError(404, 'Product not found');

  res.json(product);
}));

module.exports = router;

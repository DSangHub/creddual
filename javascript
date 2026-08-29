// backend/src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./api/auth/auth.routes'));
app.use('/api/consumers', require('./api/consumers/consumer.routes'));
app.use('/api/merchants', require('./api/merchants/merchant.routes'));
app.use('/api/financial', require('./api/financial-institutions/fi.routes'));
app.use('/api/products', require('./api/products/product.routes'));
app.use('/api/rewards', require('./api/rewards/reward.routes'));
app.use('/api/transactions', require('./api/transactions/transaction.routes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Creddual API running on port ${PORT}`);
});

module.exports = app;
// backend/src/api/auth/auth.routes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'CONSUMER'
      }
    });
    
    // Create role-specific profile
    if (role === 'CONSUMER') {
      await prisma.consumer.create({
        data: {
          userId: user.id,
          minMonthlySpend: 100,
          minWeeklySpend: 25
        }
      });
    } else if (role === 'MERCHANT') {
      await prisma.merchant.create({
        data: {
          userId: user.id,
          businessName: req.body.businessName || 'Business',
          businessType: req.body.businessType || 'Retail',
          address: req.body.address || 'Address',
          city: req.body.city || 'City',
          state: req.body.state || 'State',
          zipCode: req.body.zipCode || '12345',
          phone: phone || '000-000-0000'
        }
      });
    } else if (role === 'FI') {
      await prisma.financialInstitution.create({
        data: {
          userId: user.id,
          institutionName: req.body.institutionName || 'Financial Institution',
          institutionType: req.body.institutionType || 'Bank',
          address: req.body.address || 'Address',
          city: req.body.city || 'City',
          state: req.body.state || 'State',
          zipCode: req.body.zipCode || '12345'
        }
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { authMiddleware, roleGuard };// backend/src/api/consumers/consumer.routes.js

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

module.exports = router;// backend/src/api/financial-institutions/fi.routes.js

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

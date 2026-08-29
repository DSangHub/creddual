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

module.exports = { authMiddleware, roleGuard };

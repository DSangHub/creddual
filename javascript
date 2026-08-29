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

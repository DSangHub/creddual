// backend/src/app.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.');
}

const app = express();

// Needed for correct client IPs (rate limiting) behind Vercel/Render/nginx.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// Security
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
// Stricter limit on credential endpoints to slow down password guessing.
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' }
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./api/auth/auth.routes'));
app.use('/api/consumers', require('./api/consumers/consumer.routes'));
app.use('/api/merchants', require('./api/merchants/merchant.routes'));
app.use('/api/financial', require('./api/financial-institutions/fi.routes'));
app.use('/api/products', require('./api/products/product.routes'));
app.use('/api/rewards', require('./api/rewards/reward.routes'));
app.use('/api/transactions', require('./api/transactions/transaction.routes'));

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handling
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (err.expose && err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  // Unique-constraint violation from Prisma.
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Already exists' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Creddual API running on port ${PORT}`);
  });
}

module.exports = app;

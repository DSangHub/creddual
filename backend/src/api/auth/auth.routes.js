// backend/src/api/auth/auth.routes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { asyncHandler, HttpError } = require('../../lib/http');
const { authMiddleware } = require('../../middleware/auth');

// ADMIN accounts are never created through public registration.
const SELF_SERVICE_ROLES = ['CONSUMER', 'MERCHANT', 'FI'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role
});

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const firstName = text(body.firstName);
  const lastName = text(body.lastName);
  const phone = text(body.phone) || null;
  const role = body.role || 'CONSUMER';

  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'A valid email is required');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (!firstName || !lastName) throw new HttpError(400, 'First and last name are required');
  if (!SELF_SERVICE_ROLES.includes(role)) throw new HttpError(400, 'Invalid role');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new HttpError(400, 'User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  // Role-specific profile, created together with the user so a failure
  // can't leave an account without its profile.
  let profile = {};
  if (role === 'CONSUMER') {
    profile = { consumer: { create: { minMonthlySpend: 100, minWeeklySpend: 25 } } };
  } else if (role === 'MERCHANT') {
    profile = {
      merchant: {
        create: {
          businessName: text(body.businessName) || 'Business',
          businessType: text(body.businessType) || 'Retail',
          address: text(body.address) || 'Address',
          city: text(body.city) || 'City',
          state: text(body.state) || 'State',
          zipCode: text(body.zipCode) || '12345',
          phone: phone || '000-000-0000'
        }
      }
    };
  } else if (role === 'FI') {
    profile = {
      financialInst: {
        create: {
          institutionName: text(body.institutionName) || 'Financial Institution',
          institutionType: text(body.institutionType) || 'Bank',
          address: text(body.address) || 'Address',
          city: text(body.city) || 'City',
          state: text(body.state) || 'State',
          zipCode: text(body.zipCode) || '12345'
        }
      }
    };
  }

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, phone, role, ...profile }
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await prisma.user.findUnique({ where: { email } });
  const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;
  if (!isValidPassword) throw new HttpError(401, 'Invalid credentials');

  res.json({ token: signToken(user), user: publicUser(user) });
}));

// Current user (lets the frontend restore a session from a stored token)
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;

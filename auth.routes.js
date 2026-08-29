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

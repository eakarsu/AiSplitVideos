const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/demo-credentials', (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'false') {
    return res.status(404).json({ error: 'Not found' });
  }
  const email = process.env.DEMO_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.DEMO_PASSWORD || process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password) return res.status(503).json({ error: 'Demo credentials are not configured' });
  return res.json({ email, password });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: String(user.id), id: user.id, email: user.email, role: user.role || 'user', tenantId: process.env.GOVERNANCE_TENANT_ID, subjectIds: [`user:${user.id}`] },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (email, password, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, email, name, avatar_url',
      [email, hashedPassword, name, `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { sub: String(user.id), id: user.id, email: user.email, role: user.role || 'user', tenantId: process.env.GOVERNANCE_TENANT_ID, subjectIds: [`user:${user.id}`] },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;

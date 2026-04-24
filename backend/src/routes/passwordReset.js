const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Request password reset
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }
    const token = uuidv4();
    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.rows[0].id, token]
    );
    // In production, send email here
    res.json({ message: 'If that email exists, a reset link has been sent', token });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify reset token
router.get('/verify/:token', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    res.json({ valid: true });
  } catch (error) {
    console.error('Token verify error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Reset password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await db.query(
      `SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, result.rows[0].user_id]);
    await db.query('UPDATE password_resets SET used = true WHERE id = $1', [result.rows[0].id]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;

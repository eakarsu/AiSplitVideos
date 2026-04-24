const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Send verification email
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const token = uuidv4();
    await db.query(
      `INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '48 hours')`,
      [req.user.id, token]
    );
    // In production, send email here
    res.json({ message: 'Verification email sent', token });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify email token
router.get('/verify/:token', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM email_verifications WHERE token = $1 AND verified = false AND expires_at > NOW()`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    await db.query('UPDATE email_verifications SET verified = true WHERE id = $1', [result.rows[0].id]);
    await db.query('UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].user_id]);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification
router.post('/resend', authMiddleware, async (req, res) => {
  try {
    const user = await db.query('SELECT email_verified FROM users WHERE id = $1', [req.user.id]);
    if (user.rows[0].email_verified) {
      return res.json({ message: 'Email is already verified' });
    }
    const token = uuidv4();
    await db.query(
      `INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '48 hours')`,
      [req.user.id, token]
    );
    res.json({ message: 'Verification email resent', token });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

module.exports = router;

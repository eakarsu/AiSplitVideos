const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.email_verified, u.role, u.created_at, u.updated_at,
       (SELECT json_agg(json_build_object('id', r.id, 'name', r.name)) FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.id) as roles
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const result = await db.query(
      `UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING id, email, name, avatar_url, email_verified, role, created_at, updated_at`,
      [name, avatar_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Export user data
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const [user, projects, videos, clips, exports] = await Promise.all([
      db.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.user.id]),
      db.query('SELECT * FROM projects WHERE user_id = $1', [req.user.id]),
      db.query('SELECT * FROM videos WHERE user_id = $1', [req.user.id]),
      db.query('SELECT * FROM clips WHERE user_id = $1', [req.user.id]),
      db.query('SELECT * FROM exports WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({
      user: user.rows[0],
      projects: projects.rows,
      videos: videos.rows,
      clips: clips.rows,
      exports: exports.rows,
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;

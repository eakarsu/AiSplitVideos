const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { read, type, search, sort_by = 'created_at', sort_order = 'DESC', limit = 50, offset = 0 } = req.query;
    const validSorts = ['created_at', 'title', 'type'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (read !== undefined) {
      query += ` AND read = $${paramIndex}`;
      params.push(read === 'true');
      paramIndex++;
    }
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countParams = [...params];
    query += ` ORDER BY ${sortCol} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult, unreadResult] = await Promise.all([
      db.query(query, params),
      db.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1`, [req.user.id]),
      db.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`, [req.user.id])
    ]);

    res.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      unread: parseInt(unreadResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read = true WHERE user_id = $1 AND read = false', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Bulk delete
router.post('/bulk/delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
    await db.query('DELETE FROM notifications WHERE id = ANY($1) AND user_id = $2', [ids, req.user.id]);
    res.json({ message: `${ids.length} notifications deleted` });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({ error: 'Failed to bulk delete' });
  }
});

module.exports = router;

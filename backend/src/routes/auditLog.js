const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get audit log entries
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { action, entity_type, search, sort_by = 'created_at', sort_order = 'DESC', limit = 50, offset = 0 } = req.query;
    const validSorts = ['created_at', 'action', 'entity_type'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `SELECT al.*, u.name as user_name, u.email as user_email
                 FROM audit_log al LEFT JOIN users u ON al.user_id = u.id
                 WHERE al.user_id = $1`;
    const params = [req.user.id];
    let paramIndex = 2;

    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    if (entity_type) {
      query += ` AND al.entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }
    if (search) {
      query += ` AND (al.action ILIKE $${paramIndex} OR al.entity_type ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY al.${sortCol} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const countResult = await db.query('SELECT COUNT(*) FROM audit_log WHERE user_id = $1', [req.user.id]);
    const result = await db.query(query, params);

    res.json({
      entries: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

module.exports = router;

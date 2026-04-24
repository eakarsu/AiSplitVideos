const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all roles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, sort_by = 'created_at', sort_order = 'DESC', limit = 50, offset = 0 } = req.query;
    const validSorts = ['name', 'created_at', 'updated_at'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `SELECT r.*, (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as user_count FROM roles r`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` WHERE r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    query += ` ORDER BY r.${sortCol} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2))
    ]);

    res.json({ roles: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get single role
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as user_count FROM roles r WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Create role
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const result = await db.query(
      `INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *`,
      [name, description, JSON.stringify(permissions || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update role
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const result = await db.query(
      `UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description),
       permissions = COALESCE($3, permissions), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [name, description, permissions ? JSON.stringify(permissions) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete role
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Assign role to user
router.post('/assign', authMiddleware, async (req, res) => {
  try {
    const { user_id, role_id } = req.body;
    await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user_id, role_id]);
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// Unassign role from user
router.post('/unassign', authMiddleware, async (req, res) => {
  try {
    const { user_id, role_id } = req.body;
    await db.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [user_id, role_id]);
    res.json({ message: 'Role unassigned successfully' });
  } catch (error) {
    console.error('Unassign role error:', error);
    res.status(500).json({ error: 'Failed to unassign role' });
  }
});

// Bulk delete roles
router.post('/bulk/delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
    await db.query('DELETE FROM roles WHERE id = ANY($1)', [ids]);
    res.json({ message: `${ids.length} roles deleted` });
  } catch (error) {
    console.error('Bulk delete roles error:', error);
    res.status(500).json({ error: 'Failed to bulk delete roles' });
  }
});

module.exports = router;

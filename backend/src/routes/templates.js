const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all templates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, is_public, search, sort_by = 'usage_count', sort_order = 'DESC', limit = 50, offset = 0 } = req.query;
    const validSorts = ['name', 'category', 'usage_count', 'created_at', 'split_type'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'usage_count';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM templates WHERE (user_id = $1 OR is_public = true)';
    const params = [req.user.id];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_public !== undefined) {
      query += ` AND is_public = $${paramIndex}`;
      params.push(is_public === 'true');
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${sortCol} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM templates WHERE (user_id = $1 OR is_public = true)',
      [req.user.id]
    );

    res.json({
      templates: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM templates WHERE id = $1 AND (user_id = $2 OR is_public = true)',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, split_type, settings, is_public } = req.body;

    const result = await db.query(
      `INSERT INTO templates (user_id, name, description, category, split_type, settings, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        name,
        description || '',
        category || 'general',
        split_type,
        JSON.stringify(settings || {}),
        is_public || false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Use template (increment usage count)
router.post('/:id/use', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE templates
       SET usage_count = usage_count + 1
       WHERE id = $1 AND (user_id = $2 OR is_public = true)
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

// Update template
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, split_type, settings, is_public } = req.body;

    const result = await db.query(
      `UPDATE templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           split_type = COALESCE($4, split_type),
           settings = COALESCE($5, settings),
           is_public = COALESCE($6, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, description, category, split_type, settings ? JSON.stringify(settings) : null, is_public, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or not owned by user' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or not owned by user' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Bulk delete templates
router.post('/bulk/delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
    await db.query('DELETE FROM templates WHERE id = ANY($1) AND user_id = $2', [ids, req.user.id]);
    res.json({ message: `${ids.length} templates deleted` });
  } catch (error) {
    console.error('Bulk delete templates error:', error);
    res.status(500).json({ error: 'Failed to bulk delete' });
  }
});

module.exports = router;

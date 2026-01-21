const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all clips
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { video_id, split_job_id, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT c.*, v.title as video_title
      FROM clips c
      LEFT JOIN videos v ON c.video_id = v.id
      WHERE c.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (video_id) {
      query += ` AND c.video_id = $${paramIndex}`;
      params.push(video_id);
      paramIndex++;
    }

    if (split_job_id) {
      query += ` AND c.split_job_id = $${paramIndex}`;
      params.push(split_job_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM clips WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      clips: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get clips error:', error);
    res.status(500).json({ error: 'Failed to fetch clips' });
  }
});

// Get single clip
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, v.title as video_title, v.file_url as video_url
       FROM clips c
       LEFT JOIN videos v ON c.video_id = v.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get clip error:', error);
    res.status(500).json({ error: 'Failed to fetch clip' });
  }
});

// Create clip
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { video_id, split_job_id, title, description, start_time, end_time, ai_tags } = req.body;

    const duration = end_time - start_time;

    const result = await db.query(
      `INSERT INTO clips (user_id, video_id, split_job_id, title, description, start_time, end_time, duration, ai_tags, status, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.user.id,
        video_id,
        split_job_id || null,
        title,
        description || '',
        start_time,
        end_time,
        duration,
        ai_tags || [],
        'generated',
        `https://picsum.photos/seed/${Date.now()}/320/180`
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create clip error:', error);
    res.status(500).json({ error: 'Failed to create clip' });
  }
});

// Update clip
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, ai_tags } = req.body;

    const result = await db.query(
      `UPDATE clips
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           ai_tags = COALESCE($4, ai_tags),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, description, status, ai_tags, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update clip error:', error);
    res.status(500).json({ error: 'Failed to update clip' });
  }
});

// Delete clip
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM clips WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    res.json({ message: 'Clip deleted successfully' });
  } catch (error) {
    console.error('Delete clip error:', error);
    res.status(500).json({ error: 'Failed to delete clip' });
  }
});

module.exports = router;

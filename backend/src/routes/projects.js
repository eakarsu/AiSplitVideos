const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM projects WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM projects WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      projects: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project with stats
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM videos v WHERE v.project_id = p.id) as video_count,
        (SELECT COUNT(*) FROM clips c JOIN videos v ON c.video_id = v.id WHERE v.project_id = p.id) as clip_count,
        (SELECT COUNT(*) FROM split_jobs sj JOIN videos v ON sj.video_id = v.id WHERE v.project_id = p.id) as job_count
       FROM projects p
       WHERE p.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get videos in project
router.get('/:id/videos', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Verify project belongs to user
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.query(
      `SELECT v.*,
        (SELECT COUNT(*) FROM split_jobs sj WHERE sj.video_id = v.id) as split_job_count,
        (SELECT COUNT(*) FROM clips c WHERE c.video_id = v.id) as clips_count
       FROM videos v
       WHERE v.project_id = $1
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM videos WHERE project_id = $1',
      [req.params.id]
    );

    res.json({
      videos: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get project videos error:', error);
    res.status(500).json({ error: 'Failed to fetch project videos' });
  }
});

// Get clips in project
router.get('/:id/clips', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Verify project belongs to user
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.query(
      `SELECT c.*, v.title as video_title
       FROM clips c
       JOIN videos v ON c.video_id = v.id
       WHERE v.project_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM clips c
       JOIN videos v ON c.video_id = v.id
       WHERE v.project_id = $1`,
      [req.params.id]
    );

    res.json({
      clips: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get project clips error:', error);
    res.status(500).json({ error: 'Failed to fetch project clips' });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, status, default_settings } = req.body;

    const result = await db.query(
      `INSERT INTO projects (user_id, name, description, status, thumbnail_url, default_settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        name,
        description || '',
        status || 'active',
        `https://picsum.photos/seed/${Date.now()}/400/300`,
        default_settings ? JSON.stringify(default_settings) : null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, status, default_settings } = req.body;

    const result = await db.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           default_settings = COALESCE($4, default_settings),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, description, status, default_settings ? JSON.stringify(default_settings) : null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;

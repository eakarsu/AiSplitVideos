const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Global search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    if (!q) return res.json({ results: [], total: 0 });

    const searchPattern = `%${q}%`;
    const results = {};

    if (type === 'all' || type === 'videos') {
      const videos = await db.query(
        `SELECT id, title, description, thumbnail_url, 'video' as result_type FROM videos
         WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2) LIMIT $3`,
        [req.user.id, searchPattern, limit]
      );
      results.videos = videos.rows;
    }
    if (type === 'all' || type === 'projects') {
      const projects = await db.query(
        `SELECT id, name, description, thumbnail_url, 'project' as result_type FROM projects
         WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2) LIMIT $3`,
        [req.user.id, searchPattern, limit]
      );
      results.projects = projects.rows;
    }
    if (type === 'all' || type === 'clips') {
      const clips = await db.query(
        `SELECT id, title, description, thumbnail_url, 'clip' as result_type FROM clips
         WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2) LIMIT $3`,
        [req.user.id, searchPattern, limit]
      );
      results.clips = clips.rows;
    }
    if (type === 'all' || type === 'templates') {
      const templates = await db.query(
        `SELECT id, name, description, category, 'template' as result_type FROM templates
         WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2) LIMIT $3`,
        [req.user.id, searchPattern, limit]
      );
      results.templates = templates.rows;
    }

    const totalCount = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    // Save search to history
    await db.query(
      `INSERT INTO search_history (user_id, query, type, results_count) VALUES ($1, $2, $3, $4)`,
      [req.user.id, q, type, totalCount]
    );

    res.json({ results, total: totalCount });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Search suggestions
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ suggestions: [] });

    const [videos, projects, templates] = await Promise.all([
      db.query(`SELECT DISTINCT title as text, 'video' as type FROM videos WHERE user_id = $1 AND title ILIKE $2 LIMIT 5`, [req.user.id, `%${q}%`]),
      db.query(`SELECT DISTINCT name as text, 'project' as type FROM projects WHERE user_id = $1 AND name ILIKE $2 LIMIT 5`, [req.user.id, `%${q}%`]),
      db.query(`SELECT DISTINCT name as text, 'template' as type FROM templates WHERE user_id = $1 AND name ILIKE $2 LIMIT 5`, [req.user.id, `%${q}%`]),
    ]);

    res.json({ suggestions: [...videos.rows, ...projects.rows, ...templates.rows] });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

module.exports = router;

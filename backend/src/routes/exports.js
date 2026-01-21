const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all exports
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clip_id, video_id, status, format, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT e.*, c.title as clip_title, v.title as video_title
      FROM exports e
      LEFT JOIN clips c ON e.clip_id = c.id
      LEFT JOIN videos v ON e.video_id = v.id
      WHERE e.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (clip_id) {
      query += ` AND e.clip_id = $${paramIndex}`;
      params.push(clip_id);
      paramIndex++;
    }

    if (video_id) {
      query += ` AND e.video_id = $${paramIndex}`;
      params.push(video_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (format) {
      query += ` AND e.format = $${paramIndex}`;
      params.push(format);
      paramIndex++;
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM exports WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      exports: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get exports error:', error);
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

// Get single export
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, c.title as clip_title, v.title as video_title
       FROM exports e
       LEFT JOIN clips c ON e.clip_id = c.id
       LEFT JOIN videos v ON e.video_id = v.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get export error:', error);
    res.status(500).json({ error: 'Failed to fetch export' });
  }
});

// Create export
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clip_id, video_id, name, format, resolution, settings } = req.body;

    const result = await db.query(
      `INSERT INTO exports (user_id, clip_id, video_id, name, format, resolution, settings, status, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        clip_id || null,
        video_id || null,
        name,
        format,
        resolution || '1920x1080',
        JSON.stringify(settings || {}),
        'pending',
        0
      ]
    );

    const exportId = result.rows[0].id;

    // Simulate export processing
    processExport(exportId);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create export error:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

// Simulate export processing
async function processExport(exportId) {
  try {
    // Update to processing
    await db.query(
      `UPDATE exports SET status = 'processing', progress = 10 WHERE id = $1`,
      [exportId]
    );

    // Simulate progress updates
    const progressSteps = [25, 50, 75, 90, 100];
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await db.query(
        `UPDATE exports SET progress = $1 WHERE id = $2`,
        [progress, exportId]
      );
    }

    // Complete export
    await db.query(
      `UPDATE exports
       SET status = 'completed',
           progress = 100,
           file_size = $1,
           file_url = $2,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [
        Math.floor(Math.random() * 100000000) + 10000000,
        `/uploads/exports/export_${exportId}.mp4`,
        exportId
      ]
    );
  } catch (error) {
    console.error('Process export error:', error);
    await db.query(
      `UPDATE exports SET status = 'failed' WHERE id = $1`,
      [exportId]
    );
  }
}

// Get export presets
router.get('/presets/list', authMiddleware, (req, res) => {
  const presets = [
    { id: 'youtube_shorts', name: 'YouTube Shorts', format: 'mp4', resolution: '1080x1920', settings: { fps: 30, bitrate: '8M' } },
    { id: 'youtube_standard', name: 'YouTube Standard', format: 'mp4', resolution: '1920x1080', settings: { fps: 30, bitrate: '12M' } },
    { id: 'youtube_4k', name: 'YouTube 4K', format: 'mp4', resolution: '3840x2160', settings: { fps: 60, bitrate: '35M' } },
    { id: 'tiktok', name: 'TikTok', format: 'mp4', resolution: '1080x1920', settings: { fps: 30, bitrate: '6M' } },
    { id: 'instagram_reels', name: 'Instagram Reels', format: 'mp4', resolution: '1080x1920', settings: { fps: 30, bitrate: '6M' } },
    { id: 'instagram_feed', name: 'Instagram Feed', format: 'mp4', resolution: '1080x1080', settings: { fps: 30, bitrate: '6M' } },
    { id: 'twitter', name: 'Twitter/X', format: 'mp4', resolution: '1280x720', settings: { fps: 30, bitrate: '5M' } },
    { id: 'linkedin', name: 'LinkedIn', format: 'mp4', resolution: '1920x1080', settings: { fps: 30, bitrate: '10M' } },
    { id: 'facebook', name: 'Facebook', format: 'mp4', resolution: '1280x720', settings: { fps: 30, bitrate: '8M' } },
    { id: 'gif', name: 'GIF', format: 'gif', resolution: '480x270', settings: { fps: 15 } },
    { id: 'audio_mp3', name: 'Audio Only (MP3)', format: 'mp3', resolution: 'audio', settings: { bitrate: '320k' } },
    { id: 'webm', name: 'WebM', format: 'webm', resolution: '1920x1080', settings: { fps: 30, bitrate: '8M' } }
  ];

  res.json({ presets });
});

// Download export
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM exports WHERE id = $1 AND user_id = $2 AND status = $3',
      [req.params.id, req.user.id, 'completed']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export not found or not ready' });
    }

    const exportData = result.rows[0];

    // In production, this would serve the actual file
    res.json({
      download_url: exportData.file_url,
      filename: `${exportData.name}.${exportData.format}`,
      file_size: exportData.file_size
    });
  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({ error: 'Failed to get download' });
  }
});

// Delete export
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM exports WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.json({ message: 'Export deleted successfully' });
  } catch (error) {
    console.error('Delete export error:', error);
    res.status(500).json({ error: 'Failed to delete export' });
  }
});

module.exports = router;

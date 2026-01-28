const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'video/x-matroska', 'video/x-ms-wmv', 'video/x-m4v', 'video/mpeg'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Get all videos with split job and clip counts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { project_id, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT v.*,
        (SELECT COUNT(*) FROM split_jobs sj WHERE sj.video_id = v.id) as split_job_count,
        (SELECT COUNT(*) FROM clips c WHERE c.video_id = v.id) as clips_count
      FROM videos v
      WHERE v.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (project_id) {
      query += ` AND v.project_id = $${paramIndex}`;
      params.push(project_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND v.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM videos WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      videos: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get single video with split jobs and clips
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.*,
        (SELECT COUNT(*) FROM split_jobs sj WHERE sj.video_id = v.id) as split_job_count,
        (SELECT COUNT(*) FROM clips c WHERE c.video_id = v.id) as clips_count
       FROM videos v
       WHERE v.id = $1 AND v.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get split jobs for this video
    const splitJobsResult = await db.query(
      `SELECT id, name, split_type, status, progress, clips_generated, created_at
       FROM split_jobs WHERE video_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      split_jobs: splitJobsResult.rows
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Upload video
router.post('/upload', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { title, description, project_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const result = await db.query(
      `INSERT INTO videos (user_id, project_id, title, description, file_path, file_url, status, format)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        project_id || null,
        title || file.originalname,
        description || '',
        file.path,
        `/uploads/videos/${file.filename}`,
        'uploaded',
        path.extname(file.originalname).slice(1)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Create video (without file upload - for demo)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, project_id, duration, file_size, resolution, format } = req.body;

    const result = await db.query(
      `INSERT INTO videos (user_id, project_id, title, description, duration, file_size, resolution, format, status, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        project_id || null,
        title,
        description || '',
        duration || 0,
        file_size || 0,
        resolution || '1920x1080',
        format || 'mp4',
        'uploaded',
        `https://picsum.photos/seed/${Date.now()}/640/360`
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Update video
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, project_id, status } = req.body;

    const result = await db.query(
      `UPDATE videos
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           project_id = COALESCE($3, project_id),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, description, project_id, status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM videos WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;

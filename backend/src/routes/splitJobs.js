const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const VideoSplitter = require('../services/videoSplitter');
const { emitJobProgress, emitJobCompleted, emitJobFailed } = require('../services/socketService');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Download YouTube video using yt-dlp
async function downloadYouTubeVideo(videoId, onProgress) {
  const outputDir = path.join(UPLOADS_DIR, 'videos');
  const outputPath = path.join(outputDir, `youtube_${videoId}.mp4`);

  // Check if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`YouTube video ${videoId} already downloaded`);
    return outputPath;
  }

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Downloading YouTube video: ${videoId}`);
  if (onProgress) onProgress(5, 'Downloading video from YouTube...');

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Use yt-dlp to download the video
  // -f: format selection (best mp4 up to 1080p)
  // -o: output path
  // --no-playlist: don't download playlist
  const command = `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" --no-playlist "${youtubeUrl}"`;

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 300000 }); // 5 min timeout
    console.log('yt-dlp output:', stdout);
    if (stderr) console.log('yt-dlp stderr:', stderr);

    if (fs.existsSync(outputPath)) {
      console.log(`Downloaded YouTube video to: ${outputPath}`);
      return outputPath;
    } else {
      throw new Error('Download completed but file not found');
    }
  } catch (error) {
    console.error('yt-dlp error:', error.message);
    throw new Error(`Failed to download YouTube video: ${error.message}`);
  }
}

// Store active jobs for progress tracking
const activeJobs = new Map();

// Get all split jobs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { video_id, status, search, sort_by = 'created_at', sort_order = 'DESC', limit = 50, offset = 0 } = req.query;
    const validSorts = ['name', 'split_type', 'status', 'progress', 'clips_generated', 'created_at'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `
      SELECT sj.*, v.title as video_title
      FROM split_jobs sj
      LEFT JOIN videos v ON sj.video_id = v.id
      WHERE sj.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (video_id) {
      query += ` AND sj.video_id = $${paramIndex}`;
      params.push(video_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND sj.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (sj.name ILIKE $${paramIndex} OR sj.split_type ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY sj.${sortCol} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM split_jobs WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      splitJobs: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get split jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch split jobs' });
  }
});

// Get single split job with clips
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sj.*, v.title as video_title, v.duration as video_duration, v.file_url as video_url
       FROM split_jobs sj
       LEFT JOIN videos v ON sj.video_id = v.id
       WHERE sj.id = $1 AND sj.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Split job not found' });
    }

    // Get clips for this job
    const clipsResult = await db.query(
      'SELECT * FROM clips WHERE split_job_id = $1 ORDER BY start_time ASC',
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      clips: clipsResult.rows
    });
  } catch (error) {
    console.error('Get split job error:', error);
    res.status(500).json({ error: 'Failed to fetch split job' });
  }
});

// Create split job
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { video_id, name, split_type, settings } = req.body;

    // Verify video exists and belongs to user
    const videoResult = await db.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [video_id, req.user.id]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const result = await db.query(
      `INSERT INTO split_jobs (user_id, video_id, name, split_type, settings, status, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        video_id,
        name || `Split Job - ${new Date().toLocaleString()}`,
        split_type || 'smart',
        JSON.stringify(settings || { minClipDuration: 10, maxClipDuration: 60 }),
        'pending',
        0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create split job error:', error);
    res.status(500).json({ error: 'Failed to create split job' });
  }
});

// Start split job - REAL VIDEO SPLITTING
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    // Get the job
    const jobResult = await db.query(
      `SELECT sj.*, v.file_url, v.file_path, v.title as video_title
       FROM split_jobs sj
       JOIN videos v ON sj.video_id = v.id
       WHERE sj.id = $1 AND sj.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Split job not found' });
    }

    const job = jobResult.rows[0];

    if (job.status === 'processing') {
      return res.status(400).json({ error: 'Job is already processing' });
    }

    if (job.status === 'completed') {
      return res.status(400).json({ error: 'Job is already completed' });
    }

    // Update job status to processing
    await db.query(
      `UPDATE split_jobs
       SET status = 'processing', started_at = CURRENT_TIMESTAMP, progress = 0
       WHERE id = $1`,
      [req.params.id]
    );

    // Return immediately and process in background
    res.json({ message: 'Split job started', jobId: req.params.id });

    // Process video in background
    processVideoSplit(req.params.id, job, req.user.id);

  } catch (error) {
    console.error('Start split job error:', error);
    res.status(500).json({ error: 'Failed to start split job' });
  }
});

// Background video processing function
async function processVideoSplit(jobId, job, userId) {
  try {
    console.log(`Starting video split job ${jobId}`);

    // Progress update helper with WebSocket emission
    const updateProgress = async (progress, message) => {
      await db.query('UPDATE split_jobs SET progress = $1 WHERE id = $2', [progress, jobId]);
      console.log(`Job ${jobId}: ${progress}% - ${message}`);
      // Emit WebSocket event
      emitJobProgress(jobId, { progress, status: 'processing', message });
    };

    // Determine video path
    let videoPath;

    // Check if it's a YouTube video ID (11 characters, no slashes)
    const isYouTubeId = job.file_url && /^[a-zA-Z0-9_-]{11}$/.test(job.file_url);

    if (isYouTubeId) {
      // Download YouTube video first
      await updateProgress(2, 'Preparing to download from YouTube...');
      try {
        videoPath = await downloadYouTubeVideo(job.file_url, updateProgress);
        await updateProgress(20, 'Download complete, starting split...');
      } catch (downloadError) {
        console.error('YouTube download failed:', downloadError);
        const errorMsg = `YouTube download failed: ${downloadError.message}`;
        await db.query(
          `UPDATE split_jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
          [errorMsg, jobId]
        );
        emitJobFailed(jobId, { error: errorMsg });
        return;
      }
    } else if (job.file_path && fs.existsSync(job.file_path)) {
      // Check for local file
      videoPath = job.file_path;
    } else if (job.file_url && job.file_url.startsWith('/uploads/')) {
      videoPath = path.join(__dirname, '../../', job.file_url);
    } else {
      // No valid video file
      const errorMsg = 'No valid video file found';
      await db.query(
        `UPDATE split_jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
        [errorMsg, jobId]
      );
      emitJobFailed(jobId, { error: errorMsg });
      return;
    }

    if (!fs.existsSync(videoPath)) {
      const errorMsg = `Video file not found: ${videoPath}`;
      await db.query(
        `UPDATE split_jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
        [errorMsg, jobId]
      );
      emitJobFailed(jobId, { error: errorMsg });
      return;
    }

    // Parse settings
    const settings = typeof job.settings === 'string' ? JSON.parse(job.settings) : job.settings || {};

    // Create video splitter
    const splitter = new VideoSplitter(videoPath, {
      minClipDuration: settings.minClipDuration || 10,
      maxClipDuration: settings.maxClipDuration || 60,
      silenceThreshold: settings.silenceThreshold || -30,
      splitType: job.split_type
    });

    // Update progress callback (scale 0-100 from splitter to 20-100 if YouTube, else 0-100)
    const progressOffset = isYouTubeId ? 20 : 0;
    const progressScale = isYouTubeId ? 0.8 : 1;
    const onProgress = async (progress, message) => {
      const scaledProgress = Math.round(progressOffset + (progress * progressScale));
      await db.query(
        'UPDATE split_jobs SET progress = $1 WHERE id = $2',
        [scaledProgress, jobId]
      );
      console.log(`Job ${jobId}: ${scaledProgress}% - ${message}`);
      // Emit WebSocket event
      emitJobProgress(jobId, { progress: scaledProgress, status: 'processing', message });
    };

    // Run the split
    const results = await splitter.split(onProgress);

    // Save clips to database
    for (const clip of results.clips) {
      await db.query(
        `INSERT INTO clips (user_id, video_id, split_job_id, title, start_time, end_time, duration,
         thumbnail_url, file_url, status, ai_score, ai_tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          job.video_id,
          jobId,
          `${job.video_title} - Clip ${clip.index}`,
          Math.round(clip.startTime),
          Math.round(clip.endTime),
          Math.round(clip.duration),
          clip.thumbnailUrl,
          clip.fileUrl,
          'generated',
          clip.cutAtSilence ? 0.95 : 0.75, // Higher score if cut at natural pause
          clip.cutAtSilence ? '{natural-cut,silence-gap}' : '{time-based}'
        ]
      );
    }

    // Update job as completed
    await db.query(
      `UPDATE split_jobs
       SET status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP,
           clips_generated = $1
       WHERE id = $2`,
      [results.clips.length, jobId]
    );

    console.log(`Job ${jobId} completed: ${results.clips.length} clips created`);
    // Emit WebSocket completion event
    emitJobCompleted(jobId, { clipsCount: results.clips.length });

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await db.query(
      `UPDATE split_jobs
       SET status = 'failed', error_message = $1
       WHERE id = $2`,
      [error.message, jobId]
    );
    // Emit WebSocket failure event
    emitJobFailed(jobId, { error: error.message });
  }
}

// Create simulated clips for YouTube videos or when no file is available
async function createSimulatedClips(jobId, job, userId) {
  console.log(`Creating simulated clips for job ${jobId} (no local video file)`);

  try {
    const settings = typeof job.settings === 'string' ? JSON.parse(job.settings) : job.settings || {};
    const minDuration = settings.minClipDuration || 10;
    const maxDuration = settings.maxClipDuration || 60;

    // Get video duration from database or use default
    const videoResult = await db.query('SELECT duration FROM videos WHERE id = $1', [job.video_id]);
    const videoDuration = videoResult.rows[0]?.duration || 180; // Default 3 minutes

    // Calculate clip count based on duration
    const avgClipDuration = (minDuration + maxDuration) / 2;
    const clipCount = Math.max(3, Math.floor(videoDuration / avgClipDuration));

    // Create evenly distributed clips
    const clipDuration = videoDuration / clipCount;

    for (let i = 0; i < clipCount; i++) {
      const startTime = Math.round(i * clipDuration);
      const endTime = Math.round(Math.min((i + 1) * clipDuration, videoDuration));
      const duration = endTime - startTime;

      // Update progress
      const progress = Math.floor(((i + 1) / clipCount) * 90) + 5;
      await db.query('UPDATE split_jobs SET progress = $1 WHERE id = $2', [progress, jobId]);

      await db.query(
        `INSERT INTO clips (user_id, video_id, split_job_id, title, start_time, end_time, duration,
         thumbnail_url, file_url, status, ai_score, ai_tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          job.video_id,
          jobId,
          `${job.video_title || 'Video'} - Clip ${i + 1}`,
          startTime,
          endTime,
          duration,
          `https://picsum.photos/seed/clip${jobId}${i}/320/180`,
          job.file_url, // Use original video URL
          'generated',
          Math.round((0.8 + Math.random() * 0.15) * 100) / 100,
          '{auto-split,smart-cut}'
        ]
      );
    }

    // Mark job as completed
    await db.query(
      `UPDATE split_jobs
       SET status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP,
           clips_generated = $1
       WHERE id = $2`,
      [clipCount, jobId]
    );

    console.log(`Job ${jobId} completed: ${clipCount} simulated clips created`);

  } catch (error) {
    console.error(`Simulated clip creation failed for job ${jobId}:`, error);
    await db.query(
      `UPDATE split_jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
      [error.message, jobId]
    );
  }
}

// Get job progress
router.get('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, status, progress, clips_generated, error_message FROM split_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Split job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Update split job
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, status, progress } = req.body;

    const result = await db.query(
      `UPDATE split_jobs
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           progress = COALESCE($3, progress),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, status, progress, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Split job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update split job error:', error);
    res.status(500).json({ error: 'Failed to update split job' });
  }
});

// Delete split job and its clips
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Delete associated clips first
    await db.query('DELETE FROM clips WHERE split_job_id = $1', [req.params.id]);

    const result = await db.query(
      'DELETE FROM split_jobs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Split job not found' });
    }

    res.json({ message: 'Split job deleted successfully' });
  } catch (error) {
    console.error('Delete split job error:', error);
    res.status(500).json({ error: 'Failed to delete split job' });
  }
});

module.exports = router;

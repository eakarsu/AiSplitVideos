const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { exportTranscription } = require('../services/subtitleService');
const TranscriptionService = require('../services/transcriptionService');

const router = express.Router();
const transcriptionService = new TranscriptionService();
const TEMP_DIR = path.join(__dirname, '../../uploads/temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Download YouTube video audio using yt-dlp
async function downloadYouTubeAudio(videoId) {
  const outputPath = path.join(TEMP_DIR, `youtube_${videoId}_${Date.now()}.mp3`);
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`Downloading audio from YouTube: ${youtubeUrl}`);

  // Download audio only, convert to mp3
  const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${youtubeUrl}"`;

  try {
    await execAsync(command, { timeout: 600000 }); // 10 min timeout
    console.log(`YouTube audio downloaded to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('YouTube download failed:', error.message);
    throw new Error(`Failed to download YouTube video: ${error.message}`);
  }
}

// Get transcription for a video
router.get('/videos/:videoId/transcription', authMiddleware, async (req, res) => {
  try {
    // Verify video belongs to user
    const videoCheck = await db.query(
      'SELECT id FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.user.id]
    );

    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const result = await db.query(
      'SELECT * FROM transcriptions WHERE video_id = $1',
      [req.params.videoId]
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false, transcription: null });
    }

    res.json({ exists: true, transcription: result.rows[0] });
  } catch (error) {
    console.error('Get transcription error:', error);
    res.status(500).json({ error: 'Failed to fetch transcription' });
  }
});

// Create/trigger transcription for a video
router.post('/videos/:videoId/transcription', authMiddleware, async (req, res) => {
  try {
    // Verify video belongs to user and get file path
    const videoCheck = await db.query(
      'SELECT id, title, file_path, file_url FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.user.id]
    );

    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videoCheck.rows[0];

    // Check if transcription already exists
    const existingCheck = await db.query(
      'SELECT id FROM transcriptions WHERE video_id = $1',
      [req.params.videoId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Transcription already exists for this video' });
    }

    // Check if OpenAI API is configured
    if (!transcriptionService.isConfigured()) {
      return res.status(400).json({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.'
      });
    }

    // Determine if this is a YouTube video or uploaded file
    const isYouTube = video.file_url && !video.file_path &&
      (video.file_url.length === 11 || video.file_url.includes('youtube.com') || video.file_url.includes('youtu.be'));

    if (!video.file_path && !isYouTube) {
      return res.status(400).json({
        error: 'Video file not found. Only uploaded videos or YouTube videos can be transcribed.'
      });
    }

    // Create pending transcription
    const result = await db.query(
      `INSERT INTO transcriptions (video_id, status, language)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.videoId, 'pending', req.body.language || 'en']
    );

    const transcriptionId = result.rows[0].id;

    // Process transcription asynchronously using OpenAI Whisper
    (async () => {
      let audioPath = null;
      let isYouTubeAudio = false;

      try {
        console.log(`Starting transcription for video ${video.id}: ${video.title}`);

        if (isYouTube) {
          // Extract YouTube video ID
          let youtubeId = video.file_url;
          if (video.file_url.includes('youtube.com')) {
            const url = new URL(video.file_url);
            youtubeId = url.searchParams.get('v');
          } else if (video.file_url.includes('youtu.be')) {
            youtubeId = video.file_url.split('/').pop();
          }

          console.log(`Downloading YouTube video: ${youtubeId}`);
          audioPath = await downloadYouTubeAudio(youtubeId);
          isYouTubeAudio = true;
        } else {
          // Use uploaded video file
          audioPath = path.join(__dirname, '../../uploads', video.file_path);
        }

        // Transcribe using Whisper
        let transcriptionResult;
        if (isYouTubeAudio) {
          // Audio already extracted, transcribe directly
          transcriptionResult = await transcriptionService.transcribeAudio(audioPath);
          if (transcriptionResult) {
            transcriptionResult = {
              text: transcriptionResult.text,
              words: transcriptionResult.words || [],
              segments: transcriptionResult.segments || [],
              language: transcriptionResult.language || 'en'
            };
          }
        } else {
          transcriptionResult = await transcriptionService.transcribeVideo(audioPath, (progress, message) => {
            console.log(`Transcription progress: ${progress}% - ${message}`);
          });
        }

        if (transcriptionResult) {
          // Convert segments to the format expected by frontend
          const segments = (transcriptionResult.segments || []).map(s => ({
            start: s.start,
            end: s.end,
            text: (s.text || '').trim()
          }));

          await db.query(
            `UPDATE transcriptions
             SET status = 'completed',
                 full_text = $1,
                 segments = $2,
                 words = $3,
                 language = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [
              transcriptionResult.text,
              JSON.stringify(segments),
              JSON.stringify(transcriptionResult.words || []),
              transcriptionResult.language || 'en',
              transcriptionId
            ]
          );
          console.log(`Transcription completed for video ${video.id}`);
        } else {
          throw new Error('Transcription returned no results');
        }
      } catch (err) {
        console.error('Transcription processing error:', err);
        await db.query(
          `UPDATE transcriptions SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [err.message, transcriptionId]
        );
      } finally {
        // Clean up YouTube audio file
        if (isYouTubeAudio && audioPath && fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          console.log('Cleaned up temporary YouTube audio file');
        }
      }
    })();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transcription error:', error);
    res.status(500).json({ error: 'Failed to create transcription' });
  }
});

// Update transcription (edit text)
router.put('/videos/:videoId/transcription', authMiddleware, async (req, res) => {
  try {
    // Verify video belongs to user
    const videoCheck = await db.query(
      'SELECT id FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.user.id]
    );

    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { full_text, segments } = req.body;

    const result = await db.query(
      `UPDATE transcriptions
       SET full_text = COALESCE($1, full_text),
           segments = COALESCE($2, segments),
           updated_at = CURRENT_TIMESTAMP
       WHERE video_id = $3
       RETURNING *`,
      [full_text, segments ? JSON.stringify(segments) : null, req.params.videoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transcription error:', error);
    res.status(500).json({ error: 'Failed to update transcription' });
  }
});

// Export transcription in various formats
router.get('/videos/:videoId/transcription/export', authMiddleware, async (req, res) => {
  try {
    const { format = 'srt' } = req.query;

    // Verify video belongs to user
    const videoCheck = await db.query(
      'SELECT id, title FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.user.id]
    );

    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const result = await db.query(
      'SELECT * FROM transcriptions WHERE video_id = $1',
      [req.params.videoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    const transcription = result.rows[0];
    const segments = typeof transcription.segments === 'string'
      ? JSON.parse(transcription.segments)
      : transcription.segments || [];

    const exported = exportTranscription(segments, transcription.full_text, format);

    // Set filename based on video title
    const filename = `${videoCheck.rows[0].title.replace(/[^a-z0-9]/gi, '_')}.${exported.extension}`;

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exported.content);
  } catch (error) {
    console.error('Export transcription error:', error);
    res.status(500).json({ error: 'Failed to export transcription' });
  }
});

// Delete transcription
router.delete('/videos/:videoId/transcription', authMiddleware, async (req, res) => {
  try {
    // Verify video belongs to user
    const videoCheck = await db.query(
      'SELECT id FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.user.id]
    );

    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await db.query('DELETE FROM transcriptions WHERE video_id = $1', [req.params.videoId]);

    res.json({ message: 'Transcription deleted successfully' });
  } catch (error) {
    console.error('Delete transcription error:', error);
    res.status(500).json({ error: 'Failed to delete transcription' });
  }
});

module.exports = router;

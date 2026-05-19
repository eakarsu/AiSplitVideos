const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// In-memory data so demo doesn't depend on DB schema changes
const SCENES = [
  { id: 1, video_id: 101, start_time: 0,    duration: 12.4, thumbnail: 'https://picsum.photos/seed/sv1/320/180',  title: 'Intro - Logo Animation' },
  { id: 2, video_id: 101, start_time: 12.4, duration: 18.7, thumbnail: 'https://picsum.photos/seed/sv2/320/180',  title: 'Wide Establishing Shot' },
  { id: 3, video_id: 101, start_time: 31.1, duration: 9.3,  thumbnail: 'https://picsum.photos/seed/sv3/320/180',  title: 'Speaker Close-Up' },
  { id: 4, video_id: 101, start_time: 40.4, duration: 22.6, thumbnail: 'https://picsum.photos/seed/sv4/320/180',  title: 'Product Demo' },
  { id: 5, video_id: 101, start_time: 63.0, duration: 14.0, thumbnail: 'https://picsum.photos/seed/sv5/320/180',  title: 'Audience Reaction' },
  { id: 6, video_id: 101, start_time: 77.0, duration: 16.5, thumbnail: 'https://picsum.photos/seed/sv6/320/180',  title: 'B-Roll Cityscape' },
  { id: 7, video_id: 101, start_time: 93.5, duration: 11.2, thumbnail: 'https://picsum.photos/seed/sv7/320/180',  title: 'Interview Segment' },
  { id: 8, video_id: 101, start_time: 104.7,duration: 25.1, thumbnail: 'https://picsum.photos/seed/sv8/320/180',  title: 'Tutorial Walkthrough' },
  { id: 9, video_id: 101, start_time: 129.8,duration: 13.4, thumbnail: 'https://picsum.photos/seed/sv9/320/180',  title: 'Highlight Compilation' },
  { id: 10,video_id: 101, start_time: 143.2,duration: 19.8, thumbnail: 'https://picsum.photos/seed/sv10/320/180', title: 'Behind the Scenes' },
  { id: 11,video_id: 101, start_time: 163.0,duration: 10.5, thumbnail: 'https://picsum.photos/seed/sv11/320/180', title: 'Call to Action' },
  { id: 12,video_id: 101, start_time: 173.5,duration: 16.0, thumbnail: 'https://picsum.photos/seed/sv12/320/180', title: 'Outro - Credits' },
];

const SPLIT_POINTS_DEFAULT = [
  { id: 1, timestamp: 0,     label: 'Intro' },
  { id: 2, timestamp: 31.1,  label: 'Speaker on' },
  { id: 3, timestamp: 63.0,  label: 'Audience' },
  { id: 4, timestamp: 104.7, label: 'Tutorial' },
  { id: 5, timestamp: 143.2, label: 'B-Roll' },
  { id: 6, timestamp: 173.5, label: 'Outro' },
  { id: 7, timestamp: 189.5, label: 'End' },
];

const EXPORT_QUEUE = [
  { id: 'exp-1001', clip_ids: [1, 2], format: 'mp4',  quality: '1080p', status: 'done',       progress: 100, created_at: new Date(Date.now() - 3600_000).toISOString() },
  { id: 'exp-1002', clip_ids: [3],    format: 'webm', quality: '720p',  status: 'processing', progress: 62,  created_at: new Date(Date.now() - 600_000).toISOString() },
  { id: 'exp-1003', clip_ids: [4, 5, 6], format: 'mov', quality: '4K',  status: 'pending',    progress: 0,   created_at: new Date(Date.now() - 60_000).toISOString() },
];

// === VIZ 1: Video Timeline scene cut markers ===
router.get('/timeline', authMiddleware, (req, res) => {
  const videoId = Number(req.query.video_id) || 101;
  const total_duration = SCENES.reduce((a, s) => a + s.duration, 0);
  const markers = SCENES.map((s) => ({
    id: s.id,
    time: Number(s.start_time.toFixed(2)),
    label: s.title,
    confidence: 0.7 + ((s.id * 7) % 30) / 100,
  }));
  res.json({
    video_id: videoId,
    title: 'Demo Video 101',
    total_duration: Number(total_duration.toFixed(2)),
    markers,
  });
});

// === VIZ 2: Scene Gallery ===
router.get('/scenes', authMiddleware, (req, res) => {
  const videoId = Number(req.query.video_id) || 101;
  res.json({
    video_id: videoId,
    scenes: SCENES.map((s) => ({
      id: s.id,
      title: s.title,
      thumbnail: s.thumbnail,
      start_time: s.start_time,
      duration: s.duration,
      end_time: Number((s.start_time + s.duration).toFixed(2)),
    })),
  });
});

// === NON-VIZ 1: Split Point Editor ===
router.get('/split-points', authMiddleware, (req, res) => {
  res.json({ video_id: 101, split_points: SPLIT_POINTS_DEFAULT });
});

router.post('/split-points/preview', authMiddleware, (req, res) => {
  const incoming = Array.isArray(req.body?.split_points) ? req.body.split_points : SPLIT_POINTS_DEFAULT;
  // sort by timestamp and compute clip durations
  const sorted = [...incoming]
    .map((p, i) => ({ id: p.id ?? i + 1, timestamp: Number(p.timestamp) || 0, label: p.label || `Point ${i + 1}` }))
    .sort((a, b) => a.timestamp - b.timestamp);
  const totalDuration = SCENES.reduce((a, s) => a + s.duration, 0);
  const clips = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    clips.push({
      clip_index: i + 1,
      start: Number(sorted[i].timestamp.toFixed(2)),
      end: Number(sorted[i + 1].timestamp.toFixed(2)),
      duration: Number((sorted[i + 1].timestamp - sorted[i].timestamp).toFixed(2)),
      label: `${sorted[i].label} -> ${sorted[i + 1].label}`,
    });
  }
  // tail clip from last split to end
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    if (last.timestamp < totalDuration) {
      clips.push({
        clip_index: clips.length + 1,
        start: Number(last.timestamp.toFixed(2)),
        end: Number(totalDuration.toFixed(2)),
        duration: Number((totalDuration - last.timestamp).toFixed(2)),
        label: `${last.label} -> end`,
      });
    }
  }
  res.json({
    split_points: sorted,
    clips,
    clip_count: clips.length,
    total_duration: Number(totalDuration.toFixed(2)),
  });
});

// === NON-VIZ 2: Bulk Export Queue ===
router.get('/exports', authMiddleware, (req, res) => {
  res.json({
    queue: EXPORT_QUEUE,
    counts: {
      pending: EXPORT_QUEUE.filter((e) => e.status === 'pending').length,
      processing: EXPORT_QUEUE.filter((e) => e.status === 'processing').length,
      done: EXPORT_QUEUE.filter((e) => e.status === 'done').length,
    },
  });
});

router.post('/exports', authMiddleware, (req, res) => {
  const { clip_ids = [], format = 'mp4', quality = '1080p' } = req.body || {};
  const allowedFormats = ['mp4', 'mov', 'webm'];
  const allowedQuality = ['480p', '720p', '1080p', '4K'];
  if (!Array.isArray(clip_ids) || clip_ids.length === 0) {
    return res.status(400).json({ error: 'clip_ids must be a non-empty array' });
  }
  const fmt = allowedFormats.includes(format) ? format : 'mp4';
  const q = allowedQuality.includes(quality) ? quality : '1080p';
  const job = {
    id: `exp-${Date.now()}`,
    clip_ids,
    format: fmt,
    quality: q,
    status: 'pending',
    progress: 0,
    created_at: new Date().toISOString(),
  };
  EXPORT_QUEUE.unshift(job);
  res.status(201).json({ queued: true, job, queue_size: EXPORT_QUEUE.length });
});

module.exports = router;

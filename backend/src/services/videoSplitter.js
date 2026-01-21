const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const TranscriptionService = require('./transcriptionService');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Video Splitter Service
 * Intelligently splits videos without cutting mid-word or mid-sentence
 */
class VideoSplitter {
  constructor(videoPath, options = {}) {
    this.videoPath = videoPath;
    this.options = {
      minClipDuration: options.minClipDuration || 10,  // Minimum clip length in seconds
      maxClipDuration: options.maxClipDuration || 60,  // Maximum clip length in seconds
      silenceThreshold: options.silenceThreshold || -30, // dB threshold for silence
      silenceMinDuration: options.silenceMinDuration || 0.3, // Minimum silence duration
      splitType: options.splitType || 'smart', // 'smart', 'silence', 'time', 'scene', 'transcription'
      useTranscription: options.useTranscription !== false, // Enable transcription by default
      ...options
    };
    this.silenceGaps = [];
    this.transcription = null;
    this.cutPoints = [];
    this.transcriptionService = new TranscriptionService();
  }

  /**
   * Get video duration using FFprobe
   */
  async getVideoDuration() {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(this.videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata() {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(this.videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }

  /**
   * Extract audio from video for analysis
   */
  async extractAudio(outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(this.videoPath)
        .output(outputPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Detect silence gaps in the video using FFmpeg
   * These are potential cut points
   */
  async detectSilence() {
    return new Promise((resolve, reject) => {
      const silenceGaps = [];

      ffmpeg(this.videoPath)
        .audioFilters(`silencedetect=noise=${this.options.silenceThreshold}dB:d=${this.options.silenceMinDuration}`)
        .format('null')
        .output('-')
        .on('stderr', (line) => {
          // Parse silence_start
          const startMatch = line.match(/silence_start: ([\d.]+)/);
          if (startMatch) {
            silenceGaps.push({ start: parseFloat(startMatch[1]), end: null });
          }

          // Parse silence_end
          const endMatch = line.match(/silence_end: ([\d.]+)/);
          if (endMatch && silenceGaps.length > 0) {
            const lastGap = silenceGaps[silenceGaps.length - 1];
            if (lastGap.end === null) {
              lastGap.end = parseFloat(endMatch[1]);
              lastGap.duration = lastGap.end - lastGap.start;
              lastGap.midpoint = lastGap.start + (lastGap.duration / 2);
            }
          }
        })
        .on('end', () => {
          this.silenceGaps = silenceGaps.filter(g => g.end !== null);
          resolve(this.silenceGaps);
        })
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Transcribe audio using OpenRouter API (Whisper-compatible)
   * Returns word-level timestamps
   */
  async transcribeAudio(audioPath) {
    try {
      // Read audio file as base64
      const audioBuffer = fs.readFileSync(audioPath);
      const audioBase64 = audioBuffer.toString('base64');

      // Use OpenRouter to transcribe (using a model that supports audio)
      // Note: OpenRouter may not directly support Whisper, so we'll use a text model
      // to analyze the silence gaps and create intelligent segments

      // For now, we'll use the silence detection as the primary method
      // and enhance it with sentence boundary detection

      console.log('Audio transcription: Using silence-based segmentation');
      return null; // Transcription not available via OpenRouter text models
    } catch (error) {
      console.error('Transcription error:', error.message);
      return null;
    }
  }

  /**
   * Calculate optimal cut points based on silence gaps and clip duration constraints
   * For speech: cuts at natural pauses (silence gaps)
   * For music: falls back to time-based splitting
   */
  calculateCutPoints(duration) {
    const cutPoints = [0]; // Always start at 0
    const minDuration = this.options.minClipDuration;
    const maxDuration = this.options.maxClipDuration;
    const targetDuration = maxDuration * 0.9; // Aim for 90% of max duration

    console.log(`Calculating cut points: min=${minDuration}s, max=${maxDuration}s, target=${targetDuration}s`);
    console.log(`Video duration: ${duration}s, Silence gaps found: ${this.silenceGaps.length}`);

    // Filter silence gaps to only include meaningful ones (longer than 0.5s)
    const meaningfulGaps = this.silenceGaps.filter(gap => gap.duration >= 0.5);
    console.log(`Meaningful silence gaps (>0.5s): ${meaningfulGaps.length}`);

    // If very few meaningful gaps, this is likely music - use time-based splitting
    const expectedClips = Math.floor(duration / maxDuration);
    if (meaningfulGaps.length < expectedClips || this.silenceGaps.length === 0) {
      console.log('Not enough silence gaps for smart splitting, using time-based splitting');
      let currentTime = maxDuration;
      while (currentTime < duration - minDuration) {
        cutPoints.push(currentTime);
        currentTime += maxDuration;
      }
      cutPoints.push(duration);
      this.cutPoints = cutPoints;
      console.log(`Time-based cut points: ${cutPoints.length - 1} clips`);
      return cutPoints;
    }

    // Smart cutting: find the best silence gap near target duration
    let lastCutPoint = 0;

    while (lastCutPoint < duration - minDuration) {
      // Find all silence gaps between minDuration and maxDuration from last cut
      const validGaps = meaningfulGaps.filter(gap => {
        const timeSinceLastCut = gap.midpoint - lastCutPoint;
        return timeSinceLastCut >= minDuration && timeSinceLastCut <= maxDuration;
      });

      if (validGaps.length === 0) {
        // No valid silence gap found - cut at maxDuration
        const nextCut = lastCutPoint + maxDuration;
        if (nextCut < duration - minDuration) {
          cutPoints.push(nextCut);
          lastCutPoint = nextCut;
          console.log(`No silence gap found, time-based cut at ${nextCut.toFixed(2)}s`);
        } else {
          break;
        }
      } else {
        // Find the gap closest to target duration
        let bestGap = validGaps[0];
        let bestDistance = Math.abs((bestGap.midpoint - lastCutPoint) - targetDuration);

        for (const gap of validGaps) {
          const clipDuration = gap.midpoint - lastCutPoint;
          const distance = Math.abs(clipDuration - targetDuration);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestGap = gap;
          }
        }

        cutPoints.push(bestGap.midpoint);
        console.log(`Smart cut at ${bestGap.midpoint.toFixed(2)}s (clip: ${(bestGap.midpoint - lastCutPoint).toFixed(2)}s, silence: ${bestGap.duration.toFixed(2)}s)`);
        lastCutPoint = bestGap.midpoint;
      }
    }

    // Always end at the video duration
    if (cutPoints[cutPoints.length - 1] < duration - 1) {
      cutPoints.push(duration);
    }

    console.log(`Final cut points: ${cutPoints.length - 1} clips`);
    this.cutPoints = cutPoints;
    return cutPoints;
  }

  /**
   * Cut video at specified timestamps
   */
  async cutVideoAtTimestamp(startTime, endTime, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(this.videoPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Generate thumbnail from video at specific timestamp
   */
  async generateThumbnail(timestamp, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(this.videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x180'
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err));
    });
  }

  /**
   * Main split function - orchestrates the entire splitting process
   */
  async split(onProgress) {
    const results = {
      clips: [],
      silenceGaps: [],
      cutPoints: [],
      metadata: null,
      transcription: null,
      splitMethod: 'silence' // 'transcription', 'silence', or 'time'
    };

    try {
      // Step 1: Get video metadata
      if (onProgress) onProgress(5, 'Analyzing video...');
      results.metadata = await this.getVideoMetadata();
      const duration = results.metadata.format.duration;
      console.log(`Video duration: ${duration}s`);

      // Step 2: Try transcription-based splitting first (if enabled and configured)
      // Skip transcription for videos longer than 1 hour (3600s) to avoid long processing times
      let useTranscriptionCuts = false;
      const MAX_TRANSCRIPTION_DURATION = 3600; // 1 hour
      if (this.options.useTranscription && this.transcriptionService.isConfigured() && duration <= MAX_TRANSCRIPTION_DURATION) {
        try {
          if (onProgress) onProgress(10, 'Transcribing video for intelligent splitting...');
          this.transcription = await this.transcriptionService.transcribeVideo(this.videoPath, (progress, message) => {
            // Map transcription progress (5-85) to our progress (10-40)
            const mappedProgress = 10 + Math.floor((progress / 100) * 30);
            if (onProgress) onProgress(mappedProgress, message);
          });

          if (this.transcription && this.transcription.segments && this.transcription.segments.length > 0) {
            console.log(`Transcription successful: ${this.transcription.segments.length} segments, ${this.transcription.words?.length || 0} words`);

            // Calculate sentence-safe cut points from transcription
            if (onProgress) onProgress(42, 'Finding sentence boundaries...');
            results.cutPoints = this.transcriptionService.findSentenceSafeCutPoints(
              this.transcription,
              this.options.minClipDuration,
              this.options.maxClipDuration
            );

            if (results.cutPoints.length > 1) {
              // Add end point if not present
              if (results.cutPoints[results.cutPoints.length - 1] < duration - 1) {
                results.cutPoints.push(duration);
              }
              useTranscriptionCuts = true;
              results.splitMethod = 'transcription';
              results.transcription = {
                text: this.transcription.text,
                segmentCount: this.transcription.segments.length,
                wordCount: this.transcription.words?.length || 0
              };
              console.log(`Using transcription-based cuts: ${results.cutPoints.length - 1} clips`);
            }
          }
        } catch (transcriptionError) {
          console.log(`Transcription failed, falling back to silence detection: ${transcriptionError.message}`);
        }
      } else if (duration > MAX_TRANSCRIPTION_DURATION) {
        console.log(`Video too long for transcription (${Math.round(duration/60)} min > ${MAX_TRANSCRIPTION_DURATION/60} min limit), using fast time-based splitting`);
      } else {
        console.log('Transcription not configured or disabled, using silence detection');
      }

      // Step 3: Fall back to silence-based detection if transcription didn't work
      if (!useTranscriptionCuts) {
        if (onProgress) onProgress(15, 'Detecting silence gaps...');
        results.silenceGaps = await this.detectSilence();
        console.log(`Found ${results.silenceGaps.length} silence gaps`);

        // Calculate optimal cut points from silence
        if (onProgress) onProgress(30, 'Calculating cut points...');
        results.cutPoints = this.calculateCutPoints(duration);

        // Determine if we used silence or time-based splitting
        const meaningfulGaps = results.silenceGaps.filter(gap => gap.duration >= 0.5);
        if (meaningfulGaps.length >= results.cutPoints.length - 1) {
          results.splitMethod = 'silence';
        } else {
          results.splitMethod = 'time';
        }
      }

      console.log(`Final split method: ${results.splitMethod}, ${results.cutPoints.length - 1} clips`);

      // Step 4: Create clips directory if it doesn't exist
      const clipsDir = path.join(UPLOADS_DIR, 'clips');
      if (!fs.existsSync(clipsDir)) {
        fs.mkdirSync(clipsDir, { recursive: true });
      }

      // Step 5: Cut video into clips
      const totalClips = results.cutPoints.length - 1;
      const progressBase = useTranscriptionCuts ? 45 : 30; // Start after transcription or silence detection
      const progressRange = 95 - progressBase - 5; // Leave room for finalizing

      for (let i = 0; i < totalClips; i++) {
        const startTime = results.cutPoints[i];
        const endTime = results.cutPoints[i + 1];
        const clipDuration = endTime - startTime;

        const clipId = uuidv4();
        const clipFilename = `clip_${clipId}.mp4`;
        const clipPath = path.join(clipsDir, clipFilename);
        const thumbnailFilename = `thumb_${clipId}.jpg`;
        const thumbnailPath = path.join(clipsDir, thumbnailFilename);

        const progress = progressBase + Math.floor((i / totalClips) * progressRange);
        if (onProgress) onProgress(progress, `Creating clip ${i + 1} of ${totalClips}...`);

        // Cut the clip
        await this.cutVideoAtTimestamp(startTime, endTime, clipPath);

        // Generate thumbnail
        try {
          await this.generateThumbnail(startTime + 1, thumbnailPath);
        } catch (e) {
          console.log('Thumbnail generation failed, using default');
        }

        // Extract transcript text for this clip if transcription was used
        let clipTranscript = null;
        if (this.transcription && this.transcription.segments) {
          const clipSegments = this.transcription.segments.filter(seg =>
            seg.start >= startTime && seg.end <= endTime
          );
          if (clipSegments.length > 0) {
            clipTranscript = clipSegments.map(s => s.text).join(' ').trim();
          }
        }

        results.clips.push({
          id: clipId,
          index: i + 1,
          startTime,
          endTime,
          duration: clipDuration,
          filePath: clipPath,
          fileUrl: `/uploads/clips/${clipFilename}`,
          thumbnailUrl: fs.existsSync(thumbnailPath)
            ? `/uploads/clips/${thumbnailFilename}`
            : null,
          // Find the silence gap used for this cut (if not using transcription)
          cutAtSilence: this.silenceGaps.find(g =>
            Math.abs(g.midpoint - endTime) < 0.5
          ) !== undefined,
          // Include transcript text for this clip
          transcript: clipTranscript,
          // Indicate if this was a sentence-safe cut
          sentenceSafeCut: results.splitMethod === 'transcription'
        });

        console.log(`Created clip ${i + 1}: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s (${clipDuration.toFixed(2)}s)${clipTranscript ? ` - "${clipTranscript.substring(0, 50)}..."` : ''}`);
      }

      if (onProgress) onProgress(95, 'Finalizing...');

      return results;
    } catch (error) {
      console.error('Video splitting error:', error);
      throw error;
    }
  }

  /**
   * Scene detection using FFmpeg's scene filter
   */
  async detectScenes(threshold = 0.3) {
    return new Promise((resolve, reject) => {
      const scenes = [];

      ffmpeg(this.videoPath)
        .videoFilters(`select='gt(scene,${threshold})',showinfo`)
        .format('null')
        .output('-')
        .on('stderr', (line) => {
          const match = line.match(/pts_time:([\d.]+)/);
          if (match) {
            scenes.push(parseFloat(match[1]));
          }
        })
        .on('end', () => resolve(scenes))
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

module.exports = VideoSplitter;

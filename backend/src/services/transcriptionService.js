const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const FormData = require('form-data');
const axios = require('axios');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TEMP_DIR = path.join(__dirname, '../../uploads/temp');

/**
 * Transcription Service using OpenAI Whisper API
 * Provides word-level timestamps for intelligent video splitting
 */
class TranscriptionService {
  constructor() {
    this.apiKey = OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  /**
   * Check if OpenAI API is configured
   */
  isConfigured() {
    return this.apiKey && this.apiKey.startsWith('sk-');
  }

  /**
   * Extract audio from video file using FFmpeg
   */
  async extractAudio(videoPath) {
    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const audioPath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`);

    console.log('Extracting audio from video...');

    // Extract audio as MP3 (Groq supports mp3, mp4, mpeg, mpga, m4a, wav, webm)
    const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -q:a 9 "${audioPath}" -y`;

    try {
      await execAsync(command, { timeout: 300000 });
      console.log(`Audio extracted to: ${audioPath}`);
      return audioPath;
    } catch (error) {
      console.error('Audio extraction failed:', error.message);
      throw new Error(`Failed to extract audio: ${error.message}`);
    }
  }

  /**
   * Split audio into chunks if too large (OpenAI has 25MB limit, using 10MB for faster uploads)
   */
  async splitAudioIfNeeded(audioPath, maxSizeMB = 10) {
    const stats = fs.statSync(audioPath);
    const sizeMB = stats.size / (1024 * 1024);

    if (sizeMB <= maxSizeMB) {
      return [{ path: audioPath, startTime: 0 }];
    }

    console.log(`Audio file is ${sizeMB.toFixed(2)}MB, splitting into chunks...`);

    // Calculate chunk duration based on file size
    // Approximate: 1 minute of audio ≈ 1MB at low quality
    const totalDuration = await this.getAudioDuration(audioPath);
    const numChunks = Math.ceil(sizeMB / maxSizeMB);
    const chunkDuration = totalDuration / numChunks;

    const chunks = [];
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDuration;
      const chunkPath = path.join(TEMP_DIR, `chunk_${Date.now()}_${i}.mp3`);

      const command = `ffmpeg -i "${audioPath}" -ss ${startTime} -t ${chunkDuration} -acodec libmp3lame -ar 16000 -ac 1 "${chunkPath}" -y`;
      await execAsync(command);

      chunks.push({ path: chunkPath, startTime });
    }

    return chunks;
  }

  /**
   * Get audio duration using FFprobe
   */
  async getAudioDuration(audioPath) {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * Returns word-level timestamps
   */
  async transcribeAudio(audioPath) {
    if (!this.isConfigured()) {
      console.log('OpenAI API not configured, skipping transcription');
      return null;
    }

    console.log('Transcribing audio with OpenAI Whisper...');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');

    try {
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000 // 10 minutes
      });

      console.log('Transcription completed');
      return response.data;
    } catch (error) {
      console.error('Transcription failed:', error.response?.data || error.message);
      throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Transcribe video file
   * Returns full transcription with word and segment timestamps
   */
  async transcribeVideo(videoPath, onProgress) {
    if (!this.isConfigured()) {
      console.log('OpenAI API not configured');
      return null;
    }

    try {
      // Step 1: Extract audio
      if (onProgress) onProgress(5, 'Extracting audio...');
      const audioPath = await this.extractAudio(videoPath);

      // Step 2: Split if needed
      if (onProgress) onProgress(15, 'Preparing audio for transcription...');
      const chunks = await this.splitAudioIfNeeded(audioPath);

      // Step 3: Transcribe each chunk
      const allWords = [];
      const allSegments = [];
      let fullText = '';

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const progress = 20 + Math.floor((i / chunks.length) * 60);
        if (onProgress) onProgress(progress, `Transcribing part ${i + 1} of ${chunks.length}...`);

        const result = await this.transcribeAudio(chunk.path);

        if (result) {
          // Adjust timestamps for chunk offset
          if (result.words) {
            for (const word of result.words) {
              allWords.push({
                word: word.word,
                start: word.start + chunk.startTime,
                end: word.end + chunk.startTime
              });
            }
          }

          if (result.segments) {
            for (const segment of result.segments) {
              allSegments.push({
                text: segment.text,
                start: segment.start + chunk.startTime,
                end: segment.end + chunk.startTime
              });
            }
          }

          fullText += (fullText ? ' ' : '') + result.text;
        }

        // Clean up chunk file
        if (chunk.path !== audioPath) {
          fs.unlinkSync(chunk.path);
        }
      }

      // Clean up main audio file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      if (onProgress) onProgress(85, 'Transcription complete');

      return {
        text: fullText,
        words: allWords,
        segments: allSegments,
        language: 'en'
      };
    } catch (error) {
      console.error('Video transcription failed:', error);
      return null;
    }
  }

  /**
   * Find sentence boundaries from transcription
   * Returns array of { start, end, text } for each sentence
   */
  findSentenceBoundaries(transcription) {
    if (!transcription || !transcription.segments) {
      return [];
    }

    const sentences = [];
    let currentSentence = { text: '', start: null, end: null, words: [] };

    // Sentence ending patterns
    const sentenceEnders = /[.!?]+$/;
    const abbreviations = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp)\.$/i;

    for (const segment of transcription.segments) {
      const text = segment.text.trim();

      if (currentSentence.start === null) {
        currentSentence.start = segment.start;
      }

      currentSentence.text += (currentSentence.text ? ' ' : '') + text;
      currentSentence.end = segment.end;

      // Check if segment ends a sentence
      if (sentenceEnders.test(text) && !abbreviations.test(text)) {
        sentences.push({
          text: currentSentence.text.trim(),
          start: currentSentence.start,
          end: currentSentence.end
        });
        currentSentence = { text: '', start: null, end: null };
      }
    }

    // Add remaining text as final sentence
    if (currentSentence.text.trim()) {
      sentences.push({
        text: currentSentence.text.trim(),
        start: currentSentence.start,
        end: currentSentence.end
      });
    }

    console.log(`Found ${sentences.length} sentences`);
    return sentences;
  }

  /**
   * Find optimal cut points that respect sentence boundaries
   * Never cuts mid-sentence or mid-word
   */
  findSentenceSafeCutPoints(transcription, minDuration, maxDuration) {
    const sentences = this.findSentenceBoundaries(transcription);

    if (sentences.length === 0) {
      console.log('No sentences found, falling back to time-based cuts');
      return [];
    }

    const cutPoints = [0];
    let lastCutTime = 0;
    let currentClipSentences = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const timeSinceLastCut = sentence.end - lastCutTime;

      currentClipSentences.push(sentence);

      // Check if we should cut after this sentence
      if (timeSinceLastCut >= minDuration) {
        // If we're approaching max duration, cut here
        if (timeSinceLastCut >= maxDuration * 0.8 ||
            (i < sentences.length - 1 && sentences[i + 1].end - lastCutTime > maxDuration)) {
          cutPoints.push(sentence.end);
          lastCutTime = sentence.end;
          currentClipSentences = [];
          console.log(`Sentence-safe cut at ${sentence.end.toFixed(2)}s after: "${sentence.text.substring(0, 50)}..."`);
        }
      }

      // Force cut if we've exceeded max duration
      if (timeSinceLastCut >= maxDuration && currentClipSentences.length > 0) {
        const cutTime = currentClipSentences[currentClipSentences.length - 1].end;
        if (cutTime > lastCutTime) {
          cutPoints.push(cutTime);
          lastCutTime = cutTime;
          currentClipSentences = [];
        }
      }
    }

    console.log(`Found ${cutPoints.length - 1} sentence-safe cut points`);
    return cutPoints;
  }

  /**
   * Detect topic changes using simple keyword analysis
   * Returns timestamps where topic might change
   */
  detectTopicChanges(transcription) {
    if (!transcription || !transcription.segments) {
      return [];
    }

    const topicChanges = [];
    const windowSize = 5; // Compare 5 segments at a time

    // Topic indicator words
    const topicIndicators = [
      'now', 'next', 'moving on', 'let\'s talk about', 'another',
      'however', 'but', 'on the other hand', 'in contrast',
      'first', 'second', 'third', 'finally', 'lastly',
      'chapter', 'section', 'part', 'step'
    ];

    for (let i = windowSize; i < transcription.segments.length; i++) {
      const segment = transcription.segments[i];
      const text = segment.text.toLowerCase();

      // Check for topic indicator words
      for (const indicator of topicIndicators) {
        if (text.includes(indicator)) {
          topicChanges.push({
            time: segment.start,
            indicator: indicator,
            text: segment.text
          });
          break;
        }
      }
    }

    console.log(`Detected ${topicChanges.length} potential topic changes`);
    return topicChanges;
  }
}

module.exports = TranscriptionService;

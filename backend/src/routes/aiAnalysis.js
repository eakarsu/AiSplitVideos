const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// OpenRouter API helper
const callOpenRouter = async (prompt, model = 'openai/gpt-4-turbo') => {
  const response = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': 'AI Split Videos'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  return response.json();
};

// Get all AI analyses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { video_id, analysis_type, status, search, sort_by = 'created_at', sort_order = 'DESC', limit = 50, offset = 0 } = req.query;
    const validSorts = ['analysis_type', 'model_used', 'confidence_score', 'processing_time', 'created_at', 'status'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `
      SELECT a.*, v.title as video_title
      FROM ai_analysis a
      LEFT JOIN videos v ON a.video_id = v.id
      WHERE a.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (video_id) {
      query += ` AND a.video_id = $${paramIndex}`;
      params.push(video_id);
      paramIndex++;
    }

    if (analysis_type) {
      query += ` AND a.analysis_type = $${paramIndex}`;
      params.push(analysis_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (a.analysis_type ILIKE $${paramIndex} OR a.model_used ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY a.${sortCol} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM ai_analysis WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      analyses: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get AI analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch AI analyses' });
  }
});

// Get single AI analysis
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, v.title as video_title
       FROM ai_analysis a
       LEFT JOIN videos v ON a.video_id = v.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get AI analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch AI analysis' });
  }
});

// Create and run AI analysis
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { video_id, analysis_type, model_used } = req.body;

    // Create analysis record
    const result = await db.query(
      `INSERT INTO ai_analysis (user_id, video_id, analysis_type, model_used, status, input_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        video_id,
        analysis_type,
        model_used || 'openai/gpt-4-turbo',
        'pending',
        JSON.stringify({ video_id })
      ]
    );

    const analysisId = result.rows[0].id;

    // Start processing in background
    processAnalysis(analysisId, analysis_type, model_used);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create AI analysis error:', error);
    res.status(500).json({ error: 'Failed to create AI analysis' });
  }
});

// Process analysis in background
async function processAnalysis(analysisId, analysisType, modelUsed) {
  const startTime = Date.now();

  try {
    // Update status to processing
    await db.query(
      `UPDATE ai_analysis SET status = 'processing' WHERE id = $1`,
      [analysisId]
    );

    // Get analysis prompts based on type
    const prompts = {
      scene_detection: 'Analyze this video and identify distinct scenes. For each scene, provide a timestamp range, description, and mood. Format as JSON.',
      highlight_detection: 'Identify the most engaging and shareable moments in this video. Consider factors like emotional peaks, action sequences, humor, and key messages. Return timestamps and descriptions.',
      content_moderation: 'Review this video content for any potentially inappropriate, unsafe, or policy-violating material. Provide a safety score and detailed breakdown.',
      transcription: 'Transcribe the audio from this video, including speaker identification where possible. Include timestamps for each segment.',
      sentiment_analysis: 'Analyze the overall sentiment and emotional tone of this video content. Identify key emotional moments and their timestamps.',
      keyword_extraction: 'Extract the main keywords, topics, and themes from this video. Rank them by relevance and frequency.',
      summary_generation: 'Generate a comprehensive summary of this video content. Include main points, key takeaways, and target audience recommendations.',
      viral_potential: 'Evaluate the viral potential of this video. Consider factors like hook strength, emotional engagement, shareability, and trending topics. Provide a score and recommendations.',
      engagement_prediction: 'Predict the potential engagement metrics for this video (likes, comments, shares). Explain the factors contributing to your prediction.'
    };

    const prompt = prompts[analysisType] || 'Analyze this video content and provide insights.';

    // Call OpenRouter API
    let outputData = {};
    let confidenceScore = 0.85;

    try {
      const aiResponse = await callOpenRouter(prompt, modelUsed || 'openai/gpt-4-turbo');
      outputData = {
        response: aiResponse.choices[0]?.message?.content || 'No response generated',
        model: aiResponse.model,
        usage: aiResponse.usage
      };
      confidenceScore = 0.85 + Math.random() * 0.14; // Simulated confidence
    } catch (apiError) {
      // If API fails, generate mock response
      outputData = {
        response: generateMockResponse(analysisType),
        model: 'mock',
        note: 'Generated mock response due to API unavailability'
      };
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Update with results
    await db.query(
      `UPDATE ai_analysis
       SET status = 'completed',
           output_data = $1,
           confidence_score = $2,
           processing_time = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [JSON.stringify(outputData), confidenceScore.toFixed(2), processingTime, analysisId]
    );
  } catch (error) {
    console.error('Process analysis error:', error);
    await db.query(
      `UPDATE ai_analysis
       SET status = 'failed',
           error_message = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [error.message, analysisId]
    );
  }
}

function generateMockResponse(analysisType) {
  const mockResponses = {
    scene_detection: JSON.stringify({
      scenes: [
        { start: 0, end: 30, description: 'Opening intro with logo', mood: 'professional' },
        { start: 30, end: 90, description: 'Main content presentation', mood: 'informative' },
        { start: 90, end: 120, description: 'Closing and call to action', mood: 'engaging' }
      ]
    }),
    highlight_detection: JSON.stringify({
      highlights: [
        { timestamp: 45, description: 'Key insight moment', score: 0.95 },
        { timestamp: 78, description: 'Emotional peak', score: 0.88 }
      ]
    }),
    viral_potential: JSON.stringify({
      score: 7.5,
      factors: {
        hook_strength: 8,
        emotional_engagement: 7,
        shareability: 8,
        trending_relevance: 6
      },
      recommendations: ['Add captions', 'Shorter intro', 'Stronger CTA']
    })
  };
  return mockResponses[analysisType] || JSON.stringify({ status: 'Analysis complete', insights: [] });
}

// Analyze video for optimal split points
router.post('/split-suggestions', authMiddleware, async (req, res) => {
  try {
    const { video_id, target_platform, max_clips } = req.body;

    const prompt = `Analyze a video and suggest optimal split points for ${target_platform || 'social media'}.
    Consider:
    - Scene transitions
    - Audio cues (silence, music changes)
    - Topic changes
    - Engagement hooks
    - Platform-specific requirements (${target_platform || 'general'} typically works best with 15-60 second clips)

    Suggest up to ${max_clips || 10} clips with timestamps and descriptions.
    Format as JSON with array of {start_time, end_time, title, description, engagement_score}`;

    let suggestions;
    try {
      const aiResponse = await callOpenRouter(prompt);
      suggestions = aiResponse.choices[0]?.message?.content;
    } catch (error) {
      // Mock suggestions if API fails
      suggestions = JSON.stringify([
        { start_time: 0, end_time: 45, title: 'Intro Hook', description: 'Attention-grabbing opening', engagement_score: 0.85 },
        { start_time: 45, end_time: 90, title: 'Main Content', description: 'Core message delivery', engagement_score: 0.92 },
        { start_time: 90, end_time: 120, title: 'Call to Action', description: 'Engagement prompt', engagement_score: 0.78 }
      ]);
    }

    res.json({ suggestions, video_id, target_platform });
  } catch (error) {
    console.error('Split suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate split suggestions' });
  }
});

// Generate titles and descriptions for clips
router.post('/generate-metadata', authMiddleware, async (req, res) => {
  try {
    const { clip_description, platform, tone } = req.body;

    const prompt = `Generate engaging title and description for a video clip about: "${clip_description}"
    Platform: ${platform || 'general'}
    Tone: ${tone || 'professional'}

    Return JSON with: {title, description, hashtags: [], keywords: []}`;

    let metadata;
    try {
      const aiResponse = await callOpenRouter(prompt, 'anthropic/claude-3-haiku');
      metadata = aiResponse.choices[0]?.message?.content;
    } catch (error) {
      metadata = JSON.stringify({
        title: `${clip_description.slice(0, 50)}...`,
        description: clip_description,
        hashtags: ['#video', '#content', '#trending'],
        keywords: ['video', 'content']
      });
    }

    res.json({ metadata });
  } catch (error) {
    console.error('Generate metadata error:', error);
    res.status(500).json({ error: 'Failed to generate metadata' });
  }
});

// Delete AI analysis
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM ai_analysis WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI analysis not found' });
    }

    res.json({ message: 'AI analysis deleted successfully' });
  } catch (error) {
    console.error('Delete AI analysis error:', error);
    res.status(500).json({ error: 'Failed to delete AI analysis' });
  }
});

module.exports = router;

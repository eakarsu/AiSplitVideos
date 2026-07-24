'use strict';
const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
const REQUIRED_BASE_URL = 'https://openrouter.ai/api/v1';

router.use(authMiddleware);

router.post('/split-strategy', async (req, res, next) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (prompt.length < 10 || prompt.length > 5000) return res.status(400).json({ error: 'PROMPT_LENGTH_INVALID' });
  const startedAt = Date.now();
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
    if (!process.env.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is required');
    if (process.env.OPENROUTER_BASE_URL !== REQUIRED_BASE_URL) throw new Error('OPENROUTER_BASE_URL must use the configured OpenRouter API');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.OPENROUTER_TIMEOUT_MS || 120000));
    let providerResponse;
    try {
      providerResponse = await fetch(`${REQUIRED_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL,
          'X-Title': 'AI Split Videos',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: 'You are a video editing strategist. Recommend concrete, time-aware clip boundaries, captions, pacing, accessibility, rights review, and human approval steps. Do not claim to have inspected media not provided.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const payload = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok) throw new Error(`OpenRouter request failed with status ${providerResponse.status}`);
    const strategy = payload?.choices?.[0]?.message?.content?.trim();
    if (!strategy) throw new Error('OpenRouter returned no split strategy');
    const inserted = await db.query(
      `INSERT INTO ai_analysis(user_id,analysis_type,model_used,input_data,output_data,processing_time,status)
       VALUES($1,'split_strategy',$2,$3::jsonb,$4::jsonb,$5,'completed') RETURNING id,created_at`,
      [req.user.id, process.env.OPENROUTER_MODEL, JSON.stringify({ prompt }), JSON.stringify({ strategy, providerReceiptId: payload.id || null, usage: payload.usage || {} }), Date.now() - startedAt],
    );
    return res.json({ id: inserted.rows[0].id, strategy, model: process.env.OPENROUTER_MODEL, createdAt: inserted.rows[0].created_at });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

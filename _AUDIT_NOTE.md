# Audit Note — AiSplitVideos

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 4).

## Original Recommendations

### Missing AI Counterparts
- AI-driven highlight detection
- AI-powered subtitle/caption optimization

### Missing Non-AI Features
- YouTube/TikTok/Instagram publishing integrations
- Subtitle/caption editing UI
- Watermarking/branding controls
- Public API for third-party integrations

### Custom Feature Suggestions
- Viral moment detection
- Format-specific clip optimizer
- Automated chaptering
- Speaker diarization & sentiment tracking
- Batch processing agent

## Implemented (this round)
1. `POST /api/ai-analysis/highlight-detection` — finds high-engagement segments from transcript.
2. `POST /api/ai-analysis/caption-optimization` — readability/engagement caption refinement.

Pattern reused: `callOpenRouter` w/ graceful mock fallback (matching existing endpoints). Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Format-specific clip optimizer endpoint.
2. **MECHANICAL** Automated chaptering endpoint.
3. **NEEDS-CREDS** Publishing integrations (YouTube/TikTok/IG OAuth).
4. **NEEDS-PRODUCT-DECISION** Watermarking pipeline, batch processing queue/orchestrator.

## Apply pass 3 (frontend)

- **Status:** LEFT-AS-IS. Frontend already wires the apply-2 endpoints.
- `frontend/src/pages/HighlightDetectionPage.jsx` calls `api.post('/ai-analysis/highlight-detection')`.
- `frontend/src/pages/CaptionOptimizationPage.jsx` calls `api.post('/ai-analysis/caption-optimization')`.
- Routes registered in `frontend/src/App.js` (`/highlight-detection`, `/caption-optimization`) and linked from `components/layout/Layout.jsx`.
- JWT Bearer auth via shared `api` axios instance reading `localStorage.token`.
- No FE changes needed. No deps installed.

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./services/socketService');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const projectRoutes = require('./routes/projects');
const splitJobRoutes = require('./routes/splitJobs');
const clipRoutes = require('./routes/clips');
const templateRoutes = require('./routes/templates');
const aiAnalysisRoutes = require('./routes/aiAnalysis');
const exportRoutes = require('./routes/exports');
const transcriptionRoutes = require('./routes/transcriptions');
const roleRoutes = require('./routes/roles');
const passwordResetRoutes = require('./routes/passwordReset');
const accountRoutes = require('./routes/account');
const emailVerificationRoutes = require('./routes/emailVerification');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const auditLogRoutes = require('./routes/auditLog');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io
initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/split-jobs', splitJobRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api', transcriptionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-log', auditLogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('WebSocket server initialized');
});
app.use('/api/viral-moment-detection', require('./routes/viralMomentDetection')); app.use('/api/format-clip-optimizer', require('./routes/formatClipOptimizer')); app.use('/api/auto-chaptering', require('./routes/autoChaptering')); app.use('/api/speaker-diarization', require('./routes/speakerDiarization')); app.use('/api/batch-processing-agent', require('./routes/batchProcessingAgent')); app.use('/api/publisher-integrations', require('./routes/publisherIntegrations'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-highlight-detection-endpoint-frontend-stub-exists', require('./routes/gapNoAiDrivenHighlightDetectionEndpointFrontendStubExists'));
app.use('/api/gap-no-ai-powered-subtitle-caption-optimization-endpoint', require('./routes/gapNoAiPoweredSubtitleCaptionOptimizationEndpoint'));
app.use('/api/gap-no-ai-scene-change-detection-backend', require('./routes/gapNoAiSceneChangeDetectionBackend'));
app.use('/api/gap-ai-surface-area-is-modest-6-endpoints-relative', require('./routes/gapAiSurfaceAreaIsModest6EndpointsRelative'));
app.use('/api/gap-no-integrations-with-youtube-tiktok-instagram-for-direct', require('./routes/gapNoIntegrationsWithYoutubeTiktokInstagramForDirect'));
app.use('/api/gap-no-subtitle-caption-editing-ui-in-backend', require('./routes/gapNoSubtitleCaptionEditingUiInBackend'));
app.use('/api/gap-no-watermarking-or-branding-controls', require('./routes/gapNoWatermarkingOrBrandingControls'));
app.use('/api/gap-no-public-api-for-third-party-integrations', require('./routes/gapNoPublicApiForThirdPartyIntegrations'));
app.use('/api/gap-no-webhooks-for-job-completion-notifications', require('./routes/gapNoWebhooksForJobCompletionNotifications'));

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute, ErrorBoundary } from './components/common';
import {
// === Batch 08 Gaps & Frontend Mounts ===
import CfViralMomentDetectionIdentifyingHighEngagementSegments from './pages/CfViralMomentDetectionIdentifyingHighEngagementSegments'
import CfFormatSpecificClipOptimizerForPlatformTailored from './pages/CfFormatSpecificClipOptimizerForPlatformTailored'
import CfAutomatedChapteringWithSceneChangeDetection from './pages/CfAutomatedChapteringWithSceneChangeDetection'
import CfSpeakerDiarizationAndSentimentTrackingWithEmotional from './pages/CfSpeakerDiarizationAndSentimentTrackingWithEmotional'
import CfBatchProcessingAgentWithPriorityQueueAnd from './pages/CfBatchProcessingAgentWithPriorityQueueAnd'
import CfPublisherIntegrationsWithScheduledCrossPostingTo from './pages/CfPublisherIntegrationsWithScheduledCrossPostingTo'
import GapNoAiDrivenHighlightDetectionEndpointFrontend from './pages/GapNoAiDrivenHighlightDetectionEndpointFrontend'
import GapNoAiPoweredSubtitleCaptionOptimizationEndpoint from './pages/GapNoAiPoweredSubtitleCaptionOptimizationEndpoint'
import GapNoAiSceneChangeDetectionBackend from './pages/GapNoAiSceneChangeDetectionBackend'
import GapAiSurfaceAreaIsModest6Endpoints from './pages/GapAiSurfaceAreaIsModest6Endpoints'
import GapNoIntegrationsWithYoutubeTiktokInstagramFor from './pages/GapNoIntegrationsWithYoutubeTiktokInstagramFor'
import GapNoSubtitleCaptionEditingUiInBackend from './pages/GapNoSubtitleCaptionEditingUiInBackend'
import GapNoWatermarkingOrBrandingControls from './pages/GapNoWatermarkingOrBrandingControls'
import GapNoPublicApiForThirdPartyIntegrations from './pages/GapNoPublicApiForThirdPartyIntegrations'
import GapNoWebhooksForJobCompletionNotifications from './pages/GapNoWebhooksForJobCompletionNotifications'
  LoginPage,
  Dashboard,
  ProjectsPage,
  ProjectDetailPage,
  VideosPage,
  SplitJobsPage,
  ClipsPage,
  TemplatesPage,
  AIAnalysisPage,
  ExportsPage,
  UserProfilePage,
  PasswordResetRequestPage,
  PasswordResetPage,
  SearchResultsPage,
  RolesPage,
  NotificationsPage,
  EmailVerificationPage,
  HighlightDetectionPage,
  CaptionOptimizationPage,
  FormatClipOptimizerPage,
  AutoChapterPage
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <SocketProvider>
              <ErrorBoundary>
                <div className="app">
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<PasswordResetRequestPage />} />
                    <Route path="/reset-password/:token" element={<PasswordResetPage />} />
                    <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
                    <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                    <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
                    <Route path="/split-jobs" element={<ProtectedRoute><SplitJobsPage /></ProtectedRoute>} />
                    <Route path="/clips" element={<ProtectedRoute><ClipsPage /></ProtectedRoute>} />
                    <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
                    <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysisPage /></ProtectedRoute>} />
                    <Route path="/exports" element={<ProtectedRoute><ExportsPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
                    <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    <Route path="/highlight-detection" element={<ProtectedRoute><HighlightDetectionPage /></ProtectedRoute>} />
                    <Route path="/caption-optimization" element={<ProtectedRoute><CaptionOptimizationPage /></ProtectedRoute>} />
                    <Route path="/format-clip-optimizer" element={<ProtectedRoute><FormatClipOptimizerPage /></ProtectedRoute>} />
                    <Route path="/auto-chapter" element={<ProtectedRoute><AutoChapterPage /></ProtectedRoute>} />
                  {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-viral-moment-detection-identifying-high-engagement-segments-by-sentiment" element={<ProtectedRoute><CfViralMomentDetectionIdentifyingHighEngagementSegments /></ProtectedRoute>} />
      <Route path="/cf-format-specific-clip-optimizer-for-platform-tailored-exports" element={<ProtectedRoute><CfFormatSpecificClipOptimizerForPlatformTailored /></ProtectedRoute>} />
      <Route path="/cf-automated-chaptering-with-scene-change-detection" element={<ProtectedRoute><CfAutomatedChapteringWithSceneChangeDetection /></ProtectedRoute>} />
      <Route path="/cf-speaker-diarization-and-sentiment-tracking-with-emotional-arc-visualization" element={<ProtectedRoute><CfSpeakerDiarizationAndSentimentTrackingWithEmotional /></ProtectedRoute>} />
      <Route path="/cf-batch-processing-agent-with-priority-queue-and-retry" element={<ProtectedRoute><CfBatchProcessingAgentWithPriorityQueueAnd /></ProtectedRoute>} />
      <Route path="/cf-publisher-integrations-with-scheduled-cross-posting-to-social-platforms" element={<ProtectedRoute><CfPublisherIntegrationsWithScheduledCrossPostingTo /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-highlight-detection-endpoint-frontend-stub-exists" element={<ProtectedRoute><GapNoAiDrivenHighlightDetectionEndpointFrontend /></ProtectedRoute>} />
      <Route path="/gap-no-ai-powered-subtitle-caption-optimization-endpoint" element={<ProtectedRoute><GapNoAiPoweredSubtitleCaptionOptimizationEndpoint /></ProtectedRoute>} />
      <Route path="/gap-no-ai-scene-change-detection-backend" element={<ProtectedRoute><GapNoAiSceneChangeDetectionBackend /></ProtectedRoute>} />
      <Route path="/gap-ai-surface-area-is-modest-6-endpoints-relative" element={<ProtectedRoute><GapAiSurfaceAreaIsModest6Endpoints /></ProtectedRoute>} />
      <Route path="/gap-no-integrations-with-youtube-tiktok-instagram-for-direct" element={<ProtectedRoute><GapNoIntegrationsWithYoutubeTiktokInstagramFor /></ProtectedRoute>} />
      <Route path="/gap-no-subtitle-caption-editing-ui-in-backend" element={<ProtectedRoute><GapNoSubtitleCaptionEditingUiInBackend /></ProtectedRoute>} />
      <Route path="/gap-no-watermarking-or-branding-controls" element={<ProtectedRoute><GapNoWatermarkingOrBrandingControls /></ProtectedRoute>} />
      <Route path="/gap-no-public-api-for-third-party-integrations" element={<ProtectedRoute><GapNoPublicApiForThirdPartyIntegrations /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-for-job-completion-notifications" element={<ProtectedRoute><GapNoWebhooksForJobCompletionNotifications /></ProtectedRoute>} />
      </Routes>
                </div>
              </ErrorBoundary>
            </SocketProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

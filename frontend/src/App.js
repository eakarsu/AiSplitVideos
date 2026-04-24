import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute, ErrorBoundary } from './components/common';
import {
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
  EmailVerificationPage
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

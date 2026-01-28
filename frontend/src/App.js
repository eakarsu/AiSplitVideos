import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/common';
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
  ExportsPage
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="app">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
              <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
              <Route path="/split-jobs" element={<ProtectedRoute><SplitJobsPage /></ProtectedRoute>} />
              <Route path="/clips" element={<ProtectedRoute><ClipsPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysisPage /></ProtectedRoute>} />
              <Route path="/exports" element={<ProtectedRoute><ExportsPage /></ProtectedRoute>} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

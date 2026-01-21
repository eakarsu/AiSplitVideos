require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const projectRoutes = require('./routes/projects');
const splitJobRoutes = require('./routes/splitJobs');
const clipRoutes = require('./routes/clips');
const templateRoutes = require('./routes/templates');
const aiAnalysisRoutes = require('./routes/aiAnalysis');
const exportRoutes = require('./routes/exports');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

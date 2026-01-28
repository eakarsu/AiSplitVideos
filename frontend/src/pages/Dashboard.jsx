import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Video, FolderOpen, Scissors, Film, Layout as LayoutIcon, Brain, Download,
  Upload, Clock, Play
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { formatDuration, formatShortDuration } from '../utils/formatters';
import { LoadingSpinner } from '../components/common';
import { EnhancedVideoPlayer } from '../components/video';
import { DetailModal, SplitVideoModal } from '../components/modals';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [splitVideo, setSplitVideo] = useState(null);
  const navigate = useNavigate();

  const handleDeleteVideo = async (video) => {
    try {
      await axios.delete(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(null);
      setRecentVideos(recentVideos.filter(v => v.id !== video.id));
      setStats({ ...stats, videos: (stats.videos || 1) - 1 });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete video');
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [videos, projects, clips, jobs, templates, analyses, exports] = await Promise.all([
          axios.get(`${API_URL}/videos?limit=6`),
          axios.get(`${API_URL}/projects`),
          axios.get(`${API_URL}/clips`),
          axios.get(`${API_URL}/split-jobs`),
          axios.get(`${API_URL}/templates`),
          axios.get(`${API_URL}/ai-analysis`),
          axios.get(`${API_URL}/exports`)
        ]);
        setStats({
          videos: videos.data.total,
          projects: projects.data.total,
          clips: clips.data.total,
          jobs: jobs.data.total,
          templates: templates.data.total,
          analyses: analyses.data.total,
          exports: exports.data.total
        });
        setRecentVideos(videos.data.videos);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="btn btn-primary" onClick={() => navigate('/videos')}><Upload size={18} /> Upload Video</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/videos')}><Video size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.videos || 0}</div><div className="stat-label">Videos</div></div></div>
        <div className="stat-card" onClick={() => navigate('/projects')}><FolderOpen size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.projects || 0}</div><div className="stat-label">Projects</div></div></div>
        <div className="stat-card" onClick={() => navigate('/clips')}><Film size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.clips || 0}</div><div className="stat-label">Clips</div></div></div>
        <div className="stat-card" onClick={() => navigate('/split-jobs')}><Scissors size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.jobs || 0}</div><div className="stat-label">Split Jobs</div></div></div>
        <div className="stat-card" onClick={() => navigate('/templates')}><LayoutIcon size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.templates || 0}</div><div className="stat-label">Templates</div></div></div>
        <div className="stat-card" onClick={() => navigate('/ai-analysis')}><Brain size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.analyses || 0}</div><div className="stat-label">AI Analyses</div></div></div>
        <div className="stat-card" onClick={() => navigate('/exports')}><Download size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.exports || 0}</div><div className="stat-label">Exports</div></div></div>
      </div>

      <h2 style={{ marginBottom: 16 }}>Recent Videos</h2>
      <div className="cards-grid">
        {recentVideos.map((video) => (
          <div key={video.id} className="card" onClick={() => { console.log('Card clicked:', video.id); setSelectedVideo(video); }}>
            <div className="card-image-container">
              <img src={video.thumbnail_url || 'https://via.placeholder.com/640x360'} alt={video.title} className="card-image" />
              <div className="video-play-overlay" onClick={(e) => { e.stopPropagation(); setPlayingVideo(video); }}>
                <button className="video-play-btn"><Play size={32} fill="white" /></button>
              </div>
              <div className="video-duration-badge">{formatShortDuration(video.duration)}</div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{video.title}</h3>
              <p className="card-description">{video.description || 'No description'}</p>
              <div className="card-meta">
                <span><Clock size={14} /> {formatDuration(video.duration)}</span>
                <span className={`card-badge badge-${video.status}`}>{video.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DetailModal isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)}
        title={selectedVideo?.title} item={selectedVideo} type="video"
        onAction={(action) => {
          if (action === 'split') {
            setSplitVideo(selectedVideo);
            setSelectedVideo(null);
          } else if (action === 'analyze') {
            setSelectedVideo(null);
            navigate('/ai-analysis');
          } else {
            setSelectedVideo(null);
          }
        }}
        onPlay={(video) => { setSelectedVideo(null); setPlayingVideo(video); }}
        onDelete={handleDeleteVideo} />

      <EnhancedVideoPlayer isOpen={!!playingVideo} onClose={() => setPlayingVideo(null)} video={playingVideo} />

      <SplitVideoModal
        isOpen={!!splitVideo}
        onClose={() => setSplitVideo(null)}
        video={splitVideo}
        onSplitStarted={(jobId) => {
          setSplitVideo(null);
          navigate('/clips');
        }}
      />
    </div>
  );
};

export default Dashboard;

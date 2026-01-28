import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Video, Film, Scissors, Settings, Play, Clock, Upload
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { formatDuration, formatShortDuration, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/common';
import { EnhancedVideoPlayer } from '../components/video';
import { DetailModal, SplitVideoModal } from '../components/modals';
import { BatchUploadModal } from '../components/upload';
import { ProjectSettings } from '../components/project';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [videos, setVideos] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [splitVideo, setSplitVideo] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      console.error('Fetch project error:', error);
      navigate('/projects');
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/${id}/videos`);
      setVideos(res.data.videos || []);
    } catch (error) {
      console.error('Fetch videos error:', error);
    }
  };

  const fetchClips = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/${id}/clips`);
      setClips(res.data.clips || []);
    } catch (error) {
      console.error('Fetch clips error:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProject();
      await Promise.all([fetchVideos(), fetchClips()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleSaveSettings = async (settings) => {
    try {
      await axios.put(`${API_URL}/projects/${id}`, {
        default_settings: settings
      });
      fetchProject();
    } catch (error) {
      console.error('Save settings error:', error);
      alert('Failed to save settings');
    }
  };

  const handleVideoClick = async (video) => {
    try {
      const res = await axios.get(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(res.data);
    } catch (error) {
      setSelectedVideo(video);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24
      }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: 8
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{project.name}</h1>
          <p style={{ color: '#64748b', margin: 0 }}>{project.description || 'No description'}</p>
        </div>
        <span className={`card-badge badge-${project.status}`}>{project.status}</span>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <Video size={24} className="stat-icon" />
          <div className="stat-info">
            <div className="stat-value">{project.video_count || 0}</div>
            <div className="stat-label">Videos</div>
          </div>
        </div>
        <div className="stat-card">
          <Film size={24} className="stat-icon" />
          <div className="stat-info">
            <div className="stat-value">{project.clip_count || 0}</div>
            <div className="stat-label">Clips</div>
          </div>
        </div>
        <div className="stat-card">
          <Scissors size={24} className="stat-icon" />
          <div className="stat-info">
            <div className="stat-value">{project.job_count || 0}</div>
            <div className="stat-label">Split Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} className="stat-icon" />
          <div className="stat-info">
            <div className="stat-value">{formatDate(project.created_at).split(',')[0]}</div>
            <div className="stat-label">Created</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid #334155',
        marginBottom: 24
      }}>
        {[
          { key: 'videos', label: 'Videos', icon: Video },
          { key: 'clips', label: 'Clips', icon: Film },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              color: activeTab === tab.key ? '#6366f1' : '#64748b',
              borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'videos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
              <Upload size={18} /> Upload Videos
            </button>
          </div>
          <div className="cards-grid">
            {videos.map(video => (
              <div key={video.id} className="card" onClick={() => handleVideoClick(video)}>
                <div className="card-image-container">
                  <img src={video.thumbnail_url || 'https://via.placeholder.com/640x360'} alt={video.title} className="card-image" />
                  <div className="video-play-overlay" onClick={(e) => { e.stopPropagation(); setPlayingVideo(video); }}>
                    <button className="video-play-btn"><Play size={32} fill="white" /></button>
                  </div>
                  <div className="video-duration-badge">{formatShortDuration(video.duration)}</div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{video.title}</h3>
                  <div className="card-meta">
                    <span><Clock size={14} /> {formatDuration(video.duration)}</span>
                    <span className="tag">{video.clips_count || 0} clips</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {videos.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <Video size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>No videos in this project yet</p>
              <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
                <Upload size={18} /> Upload Your First Video
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'clips' && (
        <div className="cards-grid">
          {clips.map(clip => (
            <div key={clip.id} className="card" onClick={() => setPlayingVideo(clip)}>
              <div className="card-image-container">
                <img src={clip.thumbnail_url || 'https://via.placeholder.com/320x180'} alt={clip.title} className="card-image" />
                <div className="video-play-overlay">
                  <button className="video-play-btn"><Play size={24} fill="white" /></button>
                </div>
                <div className="video-duration-badge">{clip.duration}s</div>
              </div>
              <div className="card-content">
                <h3 className="card-title">{clip.title}</h3>
                <p className="card-description">{clip.video_title}</p>
                <div className="card-meta">
                  <span><Clock size={14} /> {clip.duration}s</span>
                  <span className="score-badge">Score: {((clip.ai_score || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
          {clips.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b', gridColumn: '1 / -1' }}>
              <Film size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>No clips generated yet. Upload videos and create split jobs to generate clips.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <ProjectSettings
          settings={project.default_settings}
          onSave={handleSaveSettings}
        />
      )}

      {/* Modals */}
      <DetailModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        title={selectedVideo?.title}
        item={selectedVideo}
        type="video"
        onAction={(action) => {
          if (action === 'split') {
            setSplitVideo(selectedVideo);
            setSelectedVideo(null);
          } else if (action === 'view-clips') {
            setSelectedVideo(null);
            setActiveTab('clips');
          }
        }}
        onPlay={(video) => { setSelectedVideo(null); setPlayingVideo(video); }}
      />

      <EnhancedVideoPlayer
        isOpen={!!playingVideo}
        onClose={() => setPlayingVideo(null)}
        video={playingVideo}
        clips={clips.filter(c => c.video_id === playingVideo?.id)}
      />

      <SplitVideoModal
        isOpen={!!splitVideo}
        onClose={() => setSplitVideo(null)}
        video={splitVideo}
        onSplitStarted={(jobId) => {
          setSplitVideo(null);
          fetchClips();
          setActiveTab('clips');
        }}
      />

      <BatchUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={id}
        onUploadComplete={() => fetchVideos()}
      />
    </div>
  );
};

export default ProjectDetailPage;

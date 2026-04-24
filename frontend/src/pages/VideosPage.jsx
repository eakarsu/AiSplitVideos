import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Clock, Play, Upload } from 'lucide-react';
import { API_URL } from '../utils/api';
import { formatDuration, formatShortDuration } from '../utils/formatters';
import { LoadingSpinner } from '../components/common';
import { EnhancedVideoPlayer } from '../components/video';
import { DetailModal, CreateModal, SplitVideoModal } from '../components/modals';
import { BatchUploadModal } from '../components/upload';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [splitVideo, setSplitVideo] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_URL}/videos`);
      setVideos(res.data.videos || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Fetch videos error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  // Fetch full video details including split_jobs when clicking a video
  const handleVideoClick = async (video) => {
    try {
      const res = await axios.get(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(res.data);
    } catch (error) {
      console.error('Fetch video details error:', error);
      setSelectedVideo(video); // Fallback to basic data
    }
  };

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_URL}/videos`, data);
      fetchVideos();
    } catch (error) {
      console.error('Create video error:', error);
    }
  };

  const handleDelete = async (video) => {
    const confirmed = await confirm('Delete Video', `Are you sure you want to delete "${video.title}"?`);
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(null);
      toast.success('Video deleted');
      fetchVideos();
    } catch (error) {
      console.error('Delete video error:', error);
      toast.error('Failed to delete video');
    }
  };

  const handleAction = (action) => {
    if (action === 'split') {
      setSplitVideo(selectedVideo);
      setSelectedVideo(null);
    } else if (action === 'view-clips') {
      setSelectedVideo(null);
      navigate('/clips');
    } else if (action === 'analyze') {
      setSelectedVideo(null);
      navigate('/ai-analysis');
    } else {
      setSelectedVideo(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Videos ({total})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}><Upload size={18} /> Upload Videos</button>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(true)}><Plus size={18} /> Add URL</button>
        </div>
      </div>

      <div className="cards-grid">
        {videos.map((video) => (
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
              <p className="card-description">{video.description || 'No description'}</p>
              <div className="card-meta">
                <span><Clock size={14} /> {formatDuration(video.duration)}</span>
                {(video.split_job_count > 0 || video.clips_count > 0) && (
                  <span style={{ display: 'flex', gap: 4 }}>
                    <span className="tag" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{video.split_job_count || 0} splits</span>
                    <span className="tag" style={{ padding: '2px 6px', fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a' }}>{video.clips_count || 0} clips</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DetailModal isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)}
        title={selectedVideo?.title} item={selectedVideo} type="video"
        onAction={handleAction}
        onPlay={(video) => { setSelectedVideo(null); setPlayingVideo(video); }}
        onDelete={handleDelete} />

      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        title="New Video"
        fields={[
          { name: 'title', label: 'Video Title', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'duration', label: 'Duration (seconds)', type: 'number' },
          { name: 'resolution', label: 'Resolution', type: 'text' }
        ]}
        onSubmit={handleCreate} />

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

      <BatchUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={(count) => {
          fetchVideos();
        }}
      />
    </div>
  );
};

export default VideosPage;

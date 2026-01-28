import React from 'react';
import { X } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

const VideoPlayerModal = ({ isOpen, onClose, video }) => {
  if (!isOpen || !video) return null;

  let videoUrl = video.file_url || video.url || '';

  // If it's a local upload path, prepend the API URL
  if (videoUrl.startsWith('/uploads/')) {
    videoUrl = `http://localhost:3001${videoUrl}`;
  }

  // Check if it's a YouTube video ID or URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    // If it's just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    // Extract from various YouTube URL formats
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(videoUrl);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{video.title || 'Video Player'}</h2>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }} onClick={(e) => e.stopPropagation()}>
          {youtubeId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            </div>
          ) : (
            <video
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '70vh', background: '#000' }}
              src={videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              onClick={(e) => e.stopPropagation()}
            >
              Your browser does not support the video tag.
            </video>
          )}
          <div style={{ padding: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {video.description || 'No description'}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', color: '#94a3b8', fontSize: '0.75rem' }}>
              <span>Duration: {formatDuration(video.duration)}</span>
              <span>Resolution: {video.resolution || '-'}</span>
              <span>Format: {video.format || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;

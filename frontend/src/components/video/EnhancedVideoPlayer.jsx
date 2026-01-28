import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, X
} from 'lucide-react';
import Timeline from './Timeline';

const EnhancedVideoPlayer = ({ isOpen, onClose, video, clips = [] }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(null);
  const controlsTimeoutRef = useRef(null);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Get video URL
  let videoUrl = video?.file_url || video?.url || '';
  if (videoUrl.startsWith('/uploads/')) {
    videoUrl = `http://localhost:3001${videoUrl}`;
  }

  // Check if YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(videoUrl);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setBuffered(videoRef.current.buffered);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handlePlaybackRateChange = useCallback((rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (e) {
        console.error('Fullscreen error:', e);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (e) {
        console.error('Exit fullscreen error:', e);
      }
    }
  }, [isFullscreen]);

  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [currentTime, duration]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePlayPause, skip, toggleMute, toggleFullscreen, isFullscreen, onClose]);

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !video) return null;

  // For YouTube videos, fall back to basic player
  if (youtubeId) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{video.title || 'Video Player'}</h2>
            <button className="modal-close" onClick={onClose}><X size={24} /></button>
          </div>
          <div className="modal-body" style={{ padding: 0 }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={containerRef}
        className="enhanced-player-container"
        style={{
          position: 'relative',
          width: isFullscreen ? '100vw' : '90vw',
          maxWidth: isFullscreen ? '100%' : 1200,
          background: '#000',
          borderRadius: isFullscreen ? 0 : 8,
          overflow: 'hidden'
        }}
        onMouseMove={showControlsTemporarily}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width: '100%', display: 'block' }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={handlePlayPause}
        />

        {/* Controls overlay */}
        <div
          className="player-controls"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            padding: '40px 16px 16px',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
        >
          {/* Timeline */}
          <Timeline
            duration={duration}
            currentTime={currentTime}
            buffered={buffered}
            clips={clips}
            onSeek={handleSeek}
          />

          {/* Control buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              {/* Skip buttons */}
              <button
                onClick={() => skip(-10)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                title="Rewind 10s (J)"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => skip(10)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                title="Forward 10s (L)"
              >
                <SkipForward size={20} />
              </button>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={toggleMute}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                  title="Mute (M)"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{ width: 80, accentColor: '#6366f1' }}
                />
              </div>

              {/* Time display */}
              <span style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Settings (playback speed) */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
                {showSettings && (
                  <div style={{
                    position: 'absolute',
                    bottom: 40,
                    right: 0,
                    background: '#1e293b',
                    borderRadius: 8,
                    padding: 8,
                    minWidth: 120
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: 12, padding: '4px 8px' }}>Speed</div>
                    {playbackRates.map(rate => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        style={{
                          display: 'block',
                          width: '100%',
                          background: rate === playbackRate ? '#6366f1' : 'transparent',
                          border: 'none',
                          color: '#fff',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderRadius: 4
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>

              {/* Close (only when not fullscreen) */}
              {!isFullscreen && (
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                  title="Close (Esc)"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video title */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
            padding: 16,
            color: '#fff',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{video.title}</h3>
        </div>

        {/* Keyboard shortcuts hint */}
        {showControls && (
          <div style={{
            position: 'absolute',
            bottom: 100,
            right: 16,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 4,
            padding: '8px 12px',
            color: '#94a3b8',
            fontSize: 11
          }}>
            Space: Play/Pause | J/L: -10s/+10s | M: Mute | F: Fullscreen
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVideoPlayer;

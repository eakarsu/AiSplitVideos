import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Scissors, Film, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';
import { API_URL } from '../../utils/api';
import { SPLIT_PRESETS } from '../../utils/constants';
import { useJobProgress } from '../../hooks/useWebSocket';

const SplitVideoModal = ({ isOpen, onClose, video, onSplitStarted }) => {
  const [preset, setPreset] = useState('medium');
  const [settings, setSettings] = useState({
    name: '',
    split_type: 'smart',
    minClipDuration: 300,
    maxClipDuration: 900
  });
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  // WebSocket callbacks for job progress
  const handleProgress = useCallback((data) => {
    setProgress(data.progress);
    if (data.message) setMessage(data.message);
  }, []);

  const handleCompleted = useCallback((data) => {
    setStatus('completed');
    setProgress(100);
  }, []);

  const handleFailed = useCallback((data) => {
    setStatus('failed');
    setMessage(data.error || 'An error occurred');
  }, []);

  // Use WebSocket hook for real-time updates
  useJobProgress(jobId, {
    onProgress: handleProgress,
    onCompleted: handleCompleted,
    onFailed: handleFailed
  });

  useEffect(() => {
    if (video) {
      setSettings(s => ({ ...s, name: `Split - ${video.title}` }));
    }
  }, [video]);

  // Update settings when preset changes
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setSettings(s => ({
        ...s,
        minClipDuration: SPLIT_PRESETS[newPreset].min,
        maxClipDuration: SPLIT_PRESETS[newPreset].max
      }));
    }
  };

  // Fallback polling for when WebSocket isn't available
  useEffect(() => {
    let interval;
    if (jobId && status === 'processing') {
      // Only poll if we haven't received WebSocket updates for a while
      const pollTimeout = setTimeout(() => {
        interval = setInterval(async () => {
          try {
            const res = await axios.get(`${API_URL}/split-jobs/${jobId}/progress`);
            setProgress(res.data.progress);
            if (res.data.status === 'completed') {
              setStatus('completed');
              clearInterval(interval);
            } else if (res.data.status === 'failed') {
              setStatus('failed');
              setMessage(res.data.error_message || 'An error occurred');
              clearInterval(interval);
            }
          } catch (e) {
            console.error('Progress check failed:', e);
          }
        }, 3000); // Poll every 3 seconds as fallback
      }, 5000); // Wait 5 seconds before starting fallback polling

      return () => {
        clearTimeout(pollTimeout);
        if (interval) clearInterval(interval);
      };
    }
  }, [jobId, status]);

  const handleStartSplit = async () => {
    setLoading(true);
    try {
      // Create split job
      const createRes = await axios.post(`${API_URL}/split-jobs`, {
        video_id: video.id,
        name: settings.name,
        split_type: settings.split_type,
        settings: {
          minClipDuration: settings.minClipDuration,
          maxClipDuration: settings.maxClipDuration
        }
      });

      const newJobId = createRes.data.id;
      setJobId(newJobId);

      // Start the job
      await axios.post(`${API_URL}/split-jobs/${newJobId}/start`);
      setStatus('processing');
      setProgress(0);
      setMessage('Starting video processing...');

    } catch (error) {
      console.error('Split failed:', error);
      alert('Failed to start split job');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (status === 'completed' && onSplitStarted) {
      onSplitStarted(jobId);
    }
    setJobId(null);
    setStatus('');
    setProgress(0);
    setMessage('');
    setLoading(false);
    onClose();
  };

  if (!isOpen || !video) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && handleClose()}>
      <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title"><Scissors size={24} /> Split Video</h2>
          {!loading && <button className="modal-close" onClick={handleClose}><X size={24} /></button>}
        </div>
        <div className="modal-body">
          {!jobId ? (
            <>
              <div className="detail-field" style={{ marginBottom: 16 }}>
                <span className="detail-field-label">Video</span>
                <span className="detail-field-value">{video.title} ({formatDuration(video.duration)})</span>
              </div>

              <div className="form-group">
                <label className="form-label">Job Name</label>
                <input type="text" className="form-input" value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Clip Duration Preset</label>
                <select className="form-input" value={preset} onChange={(e) => handlePresetChange(e.target.value)}>
                  {Object.entries(SPLIT_PRESETS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Min Clip Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="form-input" value={settings.minClipDuration}
                      onChange={(e) => { setPreset('custom'); setSettings({ ...settings, minClipDuration: parseInt(e.target.value) || 60 }); }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>sec ({Math.floor(settings.minClipDuration / 60)}m)</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Clip Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="form-input" value={settings.maxClipDuration}
                      onChange={(e) => { setPreset('custom'); setSettings({ ...settings, maxClipDuration: parseInt(e.target.value) || 600 }); }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>sec ({Math.floor(settings.maxClipDuration / 60)}m)</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Split Type</label>
                <select className="form-input" value={settings.split_type}
                  onChange={(e) => setSettings({ ...settings, split_type: e.target.value })}>
                  <option value="smart">Smart Split (Silence Detection)</option>
                  <option value="time">Time-based (Fixed Intervals)</option>
                </select>
              </div>

              <div style={{ background: '#e0f2fe', padding: 12, borderRadius: 8, marginTop: 16 }}>
                <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0 }}>
                  <Film size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  <strong>Estimated clips:</strong> ~{Math.max(1, Math.ceil(video.duration / settings.maxClipDuration))} clips
                  ({Math.floor(settings.minClipDuration / 60)}-{Math.floor(settings.maxClipDuration / 60)} min each)
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              {status === 'processing' && (
                <>
                  <Loader size={48} className="status-processing" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8 }}>Splitting Video...</h3>
                  <p style={{ color: '#64748b', marginBottom: 16 }}>{message || 'Processing...'}</p>
                  <div className="progress-bar" style={{ height: 12, marginBottom: 8 }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p style={{ fontWeight: 600, color: '#6366f1' }}>{progress}%</p>
                </>
              )}
              {status === 'completed' && (
                <>
                  <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8, color: '#16a34a' }}>Split Complete!</h3>
                  <p style={{ color: '#64748b' }}>Your clips have been created successfully.</p>
                </>
              )}
              {status === 'failed' && (
                <>
                  <AlertCircle size={48} color="#dc2626" style={{ marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8, color: '#dc2626' }}>Split Failed</h3>
                  <p style={{ color: '#64748b' }}>{message || 'There was an error processing the video.'}</p>
                </>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {!jobId ? (
            <>
              <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStartSplit} disabled={loading}>
                <Scissors size={18} /> Start Split
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleClose} disabled={status === 'processing'}>
              {status === 'completed' ? 'View Clips' : status === 'failed' ? 'Close' : 'Processing...'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitVideoModal;

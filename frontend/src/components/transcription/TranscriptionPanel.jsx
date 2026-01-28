import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import { API_URL } from '../../utils/api';
import TranscriptionEditor from './TranscriptionEditor';
import SubtitleExport from './SubtitleExport';

const TranscriptionPanel = ({ videoId, videoTitle, currentTime = 0, onSeek }) => {
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState(null);

  const fetchTranscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/videos/${videoId}/transcription`);
      if (res.data.exists) {
        setTranscription(res.data.transcription);
      } else {
        setTranscription(null);
      }
    } catch (err) {
      console.error('Fetch transcription error:', err);
      setError('Failed to load transcription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchTranscription();
    }
  }, [videoId]);

  // Poll for transcription status if pending
  useEffect(() => {
    let interval;
    if (transcription?.status === 'pending') {
      interval = setInterval(fetchTranscription, 2000);
    }
    return () => clearInterval(interval);
  }, [transcription?.status]);

  const handleGenerateTranscription = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/videos/${videoId}/transcription`);
      setTranscription(res.data);
    } catch (err) {
      console.error('Generate transcription error:', err);
      setError(err.response?.data?.error || 'Failed to generate transcription');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTranscription = async (segments) => {
    try {
      const fullText = segments.map(s => s.text).join(' ');
      await axios.put(`${API_URL}/videos/${videoId}/transcription`, {
        full_text: fullText,
        segments
      });
      fetchTranscription();
    } catch (err) {
      console.error('Save transcription error:', err);
      alert('Failed to save transcription');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#64748b'
      }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 12 }} />
        Loading transcription...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 40,
        color: '#64748b'
      }}>
        <AlertCircle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchTranscription}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 40,
        color: '#64748b'
      }}>
        <FileText size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <h4 style={{ marginBottom: 8, color: '#f8fafc' }}>No Transcription Available</h4>
        <p style={{ marginBottom: 24, textAlign: 'center' }}>
          Generate a transcription to view and edit subtitles for this video.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleGenerateTranscription}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Generating...
            </>
          ) : (
            <>
              <FileText size={18} />
              Generate Transcription
            </>
          )}
        </button>
      </div>
    );
  }

  if (transcription.status === 'pending') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 40,
        color: '#64748b'
      }}>
        <Loader size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <h4 style={{ marginBottom: 8, color: '#f8fafc' }}>Generating Transcription</h4>
        <p>This may take a few moments...</p>
      </div>
    );
  }

  if (transcription.status === 'failed') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 40,
        color: '#64748b'
      }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h4 style={{ marginBottom: 8, color: '#ef4444' }}>Transcription Failed</h4>
        <p style={{ marginBottom: 16 }}>{transcription.error_message || 'An error occurred'}</p>
        <button className="btn btn-primary" onClick={handleGenerateTranscription}>
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    );
  }

  const segments = typeof transcription.segments === 'string'
    ? JSON.parse(transcription.segments)
    : transcription.segments || [];

  if (showExport) {
    return (
      <div style={{ padding: 16 }}>
        <SubtitleExport
          videoId={videoId}
          videoTitle={videoTitle}
          onClose={() => setShowExport(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header with export button */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 16
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowExport(true)}
          style={{ padding: '8px 16px' }}
        >
          <Download size={16} /> Export
        </button>
      </div>

      <TranscriptionEditor
        segments={segments}
        currentTime={currentTime}
        onSeek={onSeek}
        onSave={handleSaveTranscription}
      />
    </div>
  );
};

export default TranscriptionPanel;

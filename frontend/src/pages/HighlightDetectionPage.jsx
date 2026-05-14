import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/common';
import { useToast } from '../context/ToastContext';

const HighlightDetectionPage = () => {
  const [videoId, setVideoId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [maxHighlights, setMaxHighlights] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const parseHighlights = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const payload = {
        ...(videoId ? { video_id: Number(videoId) } : {}),
        transcript,
        max_highlights: Number(maxHighlights) || 5,
      };
      const { data } = await api.post('/ai-analysis/highlight-detection', payload);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to detect highlights';
      setError(msg);
      toast?.error?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const highlights = result ? parseHighlights(result.highlights) : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Highlight Detection</h1>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Video ID (optional)</label>
              <input className="form-input" type="number" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="e.g. 42" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Transcript</label>
              <textarea className="form-input" rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste transcript text here..." required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Max Highlights</label>
              <input className="form-input" type="number" min={1} max={20} value={maxHighlights} onChange={(e) => setMaxHighlights(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              <Sparkles size={16} /> {loading ? 'Analyzing...' : 'Detect Highlights'}
            </button>
          </div>
        </form>
      </div>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="card" style={{ padding: 16, borderColor: '#ef4444', color: '#b91c1c', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <div>
          <h2 style={{ marginBottom: 12 }}>Highlights ({highlights.length})</h2>
          {highlights.length === 0 ? (
            <div className="card" style={{ padding: 16 }}>
              <p>No structured highlights returned. Raw response:</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{typeof result.highlights === 'string' ? result.highlights : JSON.stringify(result.highlights, null, 2)}</pre>
            </div>
          ) : (
            <div className="cards-grid">
              {highlights.map((h, i) => (
                <div key={i} className="card">
                  <div className="card-content">
                    <div className="card-header-row">
                      <h3 className="card-title">{h.title || `Highlight ${i + 1}`}</h3>
                      {typeof h.viral_potential !== 'undefined' && <span className="card-badge">{h.viral_potential}/100</span>}
                    </div>
                    <p className="card-description">{h.rationale}</p>
                    <div className="card-meta">
                      <span>Start: {h.start_time}s</span>
                      <span>End: {h.end_time}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HighlightDetectionPage;

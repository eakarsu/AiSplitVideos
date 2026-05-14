import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/common';
import { useToast } from '../context/ToastContext';

const AutoChapterPage = () => {
  const [videoId, setVideoId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [targetChapterCount, setTargetChapterCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const parseChapters = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      const cleaned = String(raw).replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const payload = {
        transcript,
        ...(videoId ? { video_id: Number(videoId) } : {}),
        ...(targetChapterCount ? { target_chapter_count: Number(targetChapterCount) } : {}),
      };
      const { data } = await api.post('/ai-analysis/auto-chapter', payload);
      setResult(data);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 503
        ? 'AI service not configured. Set OPENROUTER_API_KEY on the server.'
        : (err.response?.data?.error || err.message || 'Failed to generate chapters');
      setError(msg);
      toast?.error?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const parsed = result ? parseChapters(result.chapters) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Automated Chaptering</h1>
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
              <textarea className="form-input" rows={8} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste transcript text here..." required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Target Chapter Count (optional)</label>
              <input className="form-input" type="number" min={1} max={30} value={targetChapterCount} onChange={(e) => setTargetChapterCount(e.target.value)} placeholder="5-12" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              <Sparkles size={16} /> {loading ? 'Generating...' : 'Generate Chapters'}
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
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 12 }}>Chapters</h2>
          {parsed && Array.isArray(parsed.chapters) ? (
            <ol style={{ paddingLeft: 20 }}>
              {parsed.chapters.map((c, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <strong>{Math.floor((c.start_time || 0) / 60)}:{String((c.start_time || 0) % 60).padStart(2, '0')}</strong> &mdash; {c.title}
                </li>
              ))}
            </ol>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {typeof result.chapters === 'string' ? result.chapters : JSON.stringify(result.chapters, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoChapterPage;

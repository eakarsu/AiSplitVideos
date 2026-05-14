import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/common';
import { useToast } from '../context/ToastContext';

const FormatClipOptimizerPage = () => {
  const [transcript, setTranscript] = useState('');
  const [targetFormat, setTargetFormat] = useState('shorts');
  const [targetPlatform, setTargetPlatform] = useState('youtube');
  const [sourceDuration, setSourceDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const payload = {
        transcript,
        target_format: targetFormat,
        target_platform: targetPlatform,
        ...(sourceDuration ? { source_duration_seconds: Number(sourceDuration) } : {}),
      };
      const { data } = await api.post('/ai-analysis/format-clip-optimizer', payload);
      setResult(data);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 503
        ? 'AI service not configured. Set OPENROUTER_API_KEY on the server.'
        : (err.response?.data?.error || err.message || 'Failed to optimize clip');
      setError(msg);
      toast?.error?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Format-Specific Clip Optimizer</h1>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Transcript</label>
              <textarea className="form-input" rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste transcript text here..." required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Target Format</label>
              <select className="form-input" value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}>
                <option value="shorts">YouTube Shorts</option>
                <option value="reels">Instagram Reels</option>
                <option value="tiktok">TikTok</option>
                <option value="longform-yt">Long-form YouTube</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Target Platform</label>
              <input className="form-input" type="text" value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value)} placeholder="youtube / tiktok / instagram" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Source Duration (seconds, optional)</label>
              <input className="form-input" type="number" min={0} value={sourceDuration} onChange={(e) => setSourceDuration(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              <Sparkles size={16} /> {loading ? 'Optimizing...' : 'Optimize Clip'}
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
          <h2 style={{ marginBottom: 12 }}>Optimization</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {typeof result.optimization === 'string' ? result.optimization : JSON.stringify(result.optimization, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FormatClipOptimizerPage;

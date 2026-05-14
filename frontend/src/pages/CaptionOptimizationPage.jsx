import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/common';
import { useToast } from '../context/ToastContext';

const CaptionOptimizationPage = () => {
  const [captions, setCaptions] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [audience, setAudience] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const parseOptimization = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
      } catch {
        return { optimized_captions: raw };
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const payload = { captions, platform, audience };
      const { data } = await api.post('/ai-analysis/caption-optimization', payload);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to optimize captions';
      setError(msg);
      toast?.error?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const opt = result ? parseOptimization(result.optimization) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Caption Optimization</h1>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Captions</label>
              <textarea className="form-input" rows={8} value={captions} onChange={(e) => setCaptions(e.target.value)} placeholder="Paste captions/subtitles to optimize..." required />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Platform</label>
                <select className="form-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="x">X / Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Audience</label>
                <input className="form-input" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. tech-savvy gen-z" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              <Wand2 size={16} /> {loading ? 'Optimizing...' : 'Optimize Captions'}
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

      {opt && !loading && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>Optimized Captions</h2>
            {typeof opt.readability_score !== 'undefined' && (
              <span className="card-badge">Readability {opt.readability_score}/100</span>
            )}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0f172a08', padding: 16, borderRadius: 6, fontSize: 14 }}>{opt.optimized_captions || ''}</pre>

          {Array.isArray(opt.changes_made) && opt.changes_made.length > 0 && (
            <>
              <h3 style={{ marginTop: 20 }}>Changes Made</h3>
              <ul style={{ paddingLeft: 20 }}>
                {opt.changes_made.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          {Array.isArray(opt.platform_tips) && opt.platform_tips.length > 0 && (
            <>
              <h3 style={{ marginTop: 20 }}>Platform Tips</h3>
              <ul style={{ paddingLeft: 20 }}>
                {opt.platform_tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CaptionOptimizationPage;

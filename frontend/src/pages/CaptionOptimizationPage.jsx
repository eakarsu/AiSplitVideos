import FormattedAIReport from "../components/FormattedAIReport.jsx";
import NativeAIControls from "../components/NativeAIControls.jsx";
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
  const captionsExamples = [
    '1\n00:00:00,000 --> 00:00:04,000\nWelcome to our fictional video editing lesson.\n\n2\n00:00:04,000 --> 00:00:09,000\nOrganize clips and keep captions readable.',
    '1\n00:00:00,000 --> 00:00:05,000\nMeet our fictional handmade notebook collection.\n\n2\n00:00:05,000 --> 00:00:10,000\nSee how each binding is assembled with care.',
    '1\n00:00:00,000 --> 00:00:06,000\nThis fictional science project asks a simple question.\n\n2\n00:00:06,000 --> 00:00:12,000\nReview the setup, observations, and limitations.',
  ];



  const presets = ['Editing lesson', 'Product story', 'Science project'].map((name, index) => ({ name, fill: () => {
    setCaptions((value) => value || captionsExamples[index]); setPlatform(['youtube', 'instagram', 'tiktok'][index]); setAudience(['Beginner video editors', 'Small business creators', 'Student storytellers'][index]);
    return { filled: 3, manual: [] };
  } }));

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


  return (
    <NativeAIControls busy={loading} context="SplitVideos" presets={presets}><div>
      <div className="page-header">
        <h1 className="page-title">AI Caption Optimization</h1>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Captions</label>
              <textarea data-ai-field={"captions"} className="form-input" rows={8} value={captions} onChange={(e) => setCaptions(e.target.value)} placeholder="Paste captions/subtitles to optimize..." required />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Platform</label>
                <select data-ai-field={"platform"} className="form-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
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
                <input data-ai-field={"audience"} className="form-input" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. tech-savvy gen-z" />
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

      {result && !loading && <FormattedAIReport response={result.optimization ?? result.highlights ?? result.chapters ?? result} title="AI analysis report" />}
    </div></NativeAIControls>
  );
};

export default CaptionOptimizationPage;

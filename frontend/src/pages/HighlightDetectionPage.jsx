import FormattedAIReport from "../components/FormattedAIReport.jsx";
import NativeAIControls from "../components/NativeAIControls.jsx";
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
  const examples = [
    'Fictional training transcript, 120 seconds: 00:00 Welcome to a beginner video editing lesson. 00:20 Organize source clips by topic. 00:50 Cut pauses while retaining meaning. 01:20 Add readable captions. 01:50 Review permissions and export a draft for review.',
    'Fictional training transcript, 180 seconds: 00:00 A small business introduces its handmade notebooks. 00:30 Show the binding process. 01:00 Explain recycled materials without unverified claims. 01:45 Demonstrate the product. 02:30 Invite viewers to review the catalog.',
    'Fictional training transcript, 240 seconds: 00:00 A student explains a science fair project. 00:40 Describe the question. 01:20 Show the experimental setup. 02:10 Explain illustrative results and limitations. 03:10 Summarize the lessons and ask for feedback.',
  ];



  const presets = ['Editing lesson', 'Product story', 'Science project'].map((name, index) => ({ name, fill: () => {
    setTranscript((value) => value || examples[index]); setMaxHighlights([3, 5, 8][index]);
    return { filled: 2, manual: videoId ? [] : ['an existing Video ID if you want to link this transcript to a real source'] };
  } }));

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


  return (
    <NativeAIControls busy={loading} context="SplitVideos" presets={presets}><div>
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

      {result && !loading && <FormattedAIReport response={result.optimization ?? result.highlights ?? result.chapters ?? result} title="AI analysis report" />}
    </div></NativeAIControls>
  );
};

export default HighlightDetectionPage;

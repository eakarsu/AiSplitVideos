import React, { useState } from 'react';
import api from '../utils/api';

const SplitPointEditor = ({ initialPoints = [] }) => {
  const [videoId, setVideoId] = useState(101);
  const [points, setPoints] = useState(
    initialPoints.length > 0
      ? initialPoints
      : [
          { id: 1, timestamp: 0, label: 'Intro' },
          { id: 2, timestamp: 30, label: 'Scene 2' },
        ]
  );
  const [newTime, setNewTime] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addPoint = () => {
    const t = Number(newTime);
    if (Number.isNaN(t) || t < 0) {
      setError('Timestamp must be a non-negative number');
      return;
    }
    setError('');
    const nextId = points.length > 0 ? Math.max(...points.map((p) => p.id)) + 1 : 1;
    setPoints([...points, { id: nextId, timestamp: t, label: newLabel || `Point ${nextId}` }]);
    setNewTime('');
    setNewLabel('');
  };

  const removePoint = (id) => setPoints(points.filter((p) => p.id !== id));

  const editPoint = (id, key, value) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, [key]: key === 'timestamp' ? Number(value) : value } : p)));
  };

  const runPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/custom-views/split-points/preview', {
        video_id: Number(videoId),
        split_points: points,
      });
      setPreview(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="split-point-editor" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Split Point Editor</h3>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: '#475569' }}>Video ID</label>
        <input
          type="number"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          style={{ width: 90, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>#</th>
            <th style={{ padding: 8 }}>Timestamp (s)</th>
            <th style={{ padding: 8 }}>Label</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.id} data-testid={`split-point-row-${p.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: 8 }}>{p.id}</td>
              <td style={{ padding: 8 }}>
                <input
                  type="number"
                  step="0.1"
                  value={p.timestamp}
                  onChange={(e) => editPoint(p.id, 'timestamp', e.target.value)}
                  style={{ width: 100, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </td>
              <td style={{ padding: 8 }}>
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => editPoint(p.id, 'label', e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </td>
              <td style={{ padding: 8 }}>
                <button
                  data-testid={`split-point-remove-${p.id}`}
                  onClick={() => removePoint(p.id)}
                  style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="number"
          step="0.1"
          placeholder="Timestamp"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          style={{ width: 110, padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <input
          type="text"
          placeholder="Label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ width: 160, padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <button
          data-testid="split-point-add"
          onClick={addPoint}
          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}
        >
          Add Split Point
        </button>
        <button
          data-testid="split-point-preview"
          onClick={runPreview}
          disabled={loading}
          style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Computing...' : 'Preview Clips'}
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {preview && (
        <div data-testid="split-point-preview-list">
          <h4 style={{ margin: '12px 0 8px' }}>Preview clip list ({preview.clip_count})</h4>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {preview.clips.map((c) => (
              <li key={c.clip_index} style={{ marginBottom: 4, fontSize: 13 }}>
                <strong>Clip {c.clip_index}</strong>: {c.start}s &rarr; {c.end}s ({c.duration.toFixed(1)}s) - {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SplitPointEditor;

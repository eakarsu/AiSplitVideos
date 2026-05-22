import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const FORMATS = ['mp4', 'mov', 'webm'];
const QUALITIES = ['480p', '720p', '1080p', '4K'];

const BulkExportQueue = ({ availableClips = [] }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, processing: 0, done: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    try {
      const { data } = await api.get('/custom-views/exports');
      setQueue(data.queue || []);
      setCounts(data.counts || { pending: 0, processing: 0, done: 0 });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load queue');
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const toggleClip = (id) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const submit = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one clip');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/custom-views/exports', { clip_ids: selectedIds, format, quality });
      setSelectedIds([]);
      await loadQueue();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: { bg: '#fef3c7', fg: '#92400e' },
    processing: { bg: '#dbeafe', fg: '#1e40af' },
    done: { bg: '#dcfce7', fg: '#166534' },
  };

  return (
    <div data-testid="bulk-export-queue" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Bulk Export Queue</h3>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>Select clips to export:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {availableClips.map((c) => (
            <label
              key={c.id}
              data-testid={`clip-select-${c.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 999,
                background: selectedIds.includes(c.id) ? '#e0e7ff' : '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={() => toggleClip(c.id)}
                style={{ margin: 0 }}
              />
              {c.title || `Clip ${c.id}`}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: '#475569' }}>Format</label>
        <select data-testid="export-format" value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <label style={{ fontSize: 13, color: '#475569' }}>Quality</label>
        <select data-testid="export-quality" value={quality} onChange={(e) => setQuality(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>

        <button
          data-testid="export-submit"
          onClick={submit}
          disabled={loading || selectedIds.length === 0}
          style={{
            background: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            opacity: loading || selectedIds.length === 0 ? 0.6 : 1,
          }}
        >
          {loading ? 'Queueing...' : `Queue Export (${selectedIds.length})`}
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 12 }}>
        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4 }}>Pending: {counts.pending}</span>
        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 4 }}>Processing: {counts.processing}</span>
        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4 }}>Done: {counts.done}</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Job ID</th>
            <th style={{ padding: 8 }}>Clips</th>
            <th style={{ padding: 8 }}>Format</th>
            <th style={{ padding: 8 }}>Quality</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Progress</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((j) => {
            const s = statusColors[j.status] || statusColors.pending;
            return (
              <tr key={j.id} data-testid={`queue-row-${j.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{j.id}</td>
                <td style={{ padding: 8 }}>{(j.clip_ids || []).join(', ')}</td>
                <td style={{ padding: 8 }}>{j.format}</td>
                <td style={{ padding: 8 }}>{j.quality}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ background: s.bg, color: s.fg, padding: '2px 8px', borderRadius: 4 }}>{j.status}</span>
                </td>
                <td style={{ padding: 8 }}>{j.progress}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BulkExportQueue;

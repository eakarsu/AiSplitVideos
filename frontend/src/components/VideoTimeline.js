import React, { useState } from 'react';

const VideoTimeline = ({ data }) => {
  const [selected, setSelected] = useState(null);

  if (!data) {
    return <div style={{ padding: 16, color: '#64748b' }}>No timeline data loaded.</div>;
  }

  const total = data.total_duration || 1;
  const markers = data.markers || [];

  const fmt = (t) => {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      data-testid="video-timeline"
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong>{data.title || 'Video Timeline'}</strong>
        <span style={{ color: '#94a3b8' }}>Total: {fmt(total)}</span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 64,
          background: 'linear-gradient(90deg, #1e293b, #334155)',
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        {/* time axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.08)',
            }}
          />
        ))}

        {markers.map((m) => {
          const left = `${(m.time / total) * 100}%`;
          const isSel = selected === m.id;
          return (
            <button
              key={m.id}
              data-testid={`timeline-marker-${m.id}`}
              onClick={() => setSelected(m.id)}
              title={`${m.label} @ ${fmt(m.time)}`}
              style={{
                position: 'absolute',
                left,
                top: 8,
                bottom: 8,
                width: 4,
                padding: 0,
                background: isSel ? '#facc15' : '#6366f1',
                border: 'none',
                cursor: 'pointer',
                boxShadow: isSel ? '0 0 8px #facc15' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
        <span>{markers.length} scene cut markers</span>
        {selected != null && (
          <span style={{ color: '#facc15' }}>
            Selected: {markers.find((x) => x.id === selected)?.label} ({fmt(markers.find((x) => x.id === selected)?.time || 0)})
          </span>
        )}
      </div>
    </div>
  );
};

export default VideoTimeline;

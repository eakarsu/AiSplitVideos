import React from 'react';

const SceneGallery = ({ scenes }) => {
  if (!scenes || scenes.length === 0) {
    return <div style={{ padding: 16, color: '#64748b' }}>No scenes detected yet.</div>;
  }

  const fmt = (t) => {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, '0');
    return `${m}:${s}`;
  };

  return (
    <div data-testid="scene-gallery" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {scenes.map((scene) => (
          <div
            key={scene.id}
            data-testid={`scene-card-${scene.id}`}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={scene.thumbnail}
                alt={scene.title}
                style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  background: 'rgba(15,23,42,0.85)',
                  color: '#fff',
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {scene.duration.toFixed(1)}s
              </span>
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
                {scene.title}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                <span>Start: {fmt(scene.start_time)}</span>
                <span>End: {fmt(scene.end_time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SceneGallery;

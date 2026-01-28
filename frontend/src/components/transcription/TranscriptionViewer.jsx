import React, { useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TranscriptionViewer = ({
  segments = [],
  currentTime = 0,
  onSeek,
  isEditable = false,
  onSegmentChange
}) => {
  const containerRef = useRef(null);
  const activeSegmentRef = useRef(null);

  // Find active segment based on current time
  const activeSegmentIndex = segments.findIndex(
    segment => currentTime >= segment.start && currentTime < segment.end
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeSegmentRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSegmentIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSegmentClick = (segment) => {
    if (onSeek) {
      onSeek(segment.start);
    }
  };

  if (segments.length === 0) {
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
        color: '#64748b'
      }}>
        <p>No transcription available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: 400,
        overflowY: 'auto',
        background: '#0f172a',
        borderRadius: 8,
        padding: 16
      }}
    >
      {segments.map((segment, index) => {
        const isActive = index === activeSegmentIndex;
        return (
          <div
            key={index}
            ref={isActive ? activeSegmentRef : null}
            onClick={() => handleSegmentClick(segment)}
            style={{
              display: 'flex',
              gap: 12,
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Timestamp */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 4,
              color: isActive ? '#818cf8' : '#64748b',
              fontSize: 12,
              fontFamily: 'monospace',
              minWidth: 50
            }}>
              <Clock size={12} style={{ marginTop: 2 }} />
              {formatTime(segment.start)}
            </div>

            {/* Text */}
            {isEditable ? (
              <textarea
                value={segment.text}
                onChange={(e) => {
                  if (onSegmentChange) {
                    onSegmentChange(index, { ...segment, text: e.target.value });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid #334155',
                  borderRadius: 4,
                  padding: 8,
                  color: '#f8fafc',
                  fontSize: 14,
                  lineHeight: 1.5,
                  resize: 'none',
                  minHeight: 60
                }}
              />
            ) : (
              <div style={{
                flex: 1,
                color: isActive ? '#f8fafc' : '#94a3b8',
                fontSize: 14,
                lineHeight: 1.6
              }}>
                {segment.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TranscriptionViewer;

import React, { useRef, useState, useCallback } from 'react';

const Timeline = ({
  duration,
  currentTime,
  buffered,
  clips = [],
  onSeek,
  zoom = 1
}) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = useCallback((clientX) => {
    if (!timelineRef.current || !duration) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(duration, position * duration));
  }, [duration]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    onSeek?.(time);
  };

  const handleMouseMove = (e) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(duration, position * duration));

    setHoverTime(time);
    setHoverPosition(Math.max(0, Math.min(100, position * 100)));

    if (isDragging) {
      onSeek?.(time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setIsDragging(false);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Calculate buffered ranges
  const bufferedRanges = [];
  if (buffered) {
    for (let i = 0; i < buffered.length; i++) {
      const start = (buffered.start(i) / duration) * 100;
      const end = (buffered.end(i) / duration) * 100;
      bufferedRanges.push({ start, width: end - start });
    }
  }

  return (
    <div
      ref={timelineRef}
      className="enhanced-timeline"
      style={{
        position: 'relative',
        height: 48,
        background: '#1e293b',
        borderRadius: 4,
        cursor: 'pointer',
        overflow: 'hidden'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Buffered indicator */}
      {bufferedRanges.map((range, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${range.start}%`,
            width: `${range.width}%`,
            height: '100%',
            background: 'rgba(100, 116, 139, 0.3)'
          }}
        />
      ))}

      {/* Clip markers */}
      {clips.map((clip, index) => {
        const startPercent = (clip.start_time / duration) * 100;
        const widthPercent = ((clip.end_time - clip.start_time) / duration) * 100;
        return (
          <div
            key={clip.id || index}
            style={{
              position: 'absolute',
              top: 4,
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
              height: 16,
              background: 'rgba(99, 102, 241, 0.5)',
              border: '1px solid rgba(99, 102, 241, 0.8)',
              borderRadius: 2,
              fontSize: 10,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 4px',
              lineHeight: '14px'
            }}
            title={`Clip ${index + 1}: ${formatTime(clip.start_time)} - ${formatTime(clip.end_time)}`}
          >
            {widthPercent > 5 && `Clip ${index + 1}`}
          </div>
        );
      })}

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 24,
          width: '100%',
          background: '#334155'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            transition: isDragging ? 'none' : 'width 0.1s'
          }}
        />
      </div>

      {/* Playhead */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: `${progressPercent}%`,
          width: 3,
          height: 48,
          background: '#fff',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          transform: 'translateX(-50%)',
          transition: isDragging ? 'none' : 'left 0.1s'
        }}
      />

      {/* Hover tooltip */}
      {hoverTime !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            left: `${hoverPosition}%`,
            transform: 'translateX(-50%)',
            background: '#000',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};

export default Timeline;

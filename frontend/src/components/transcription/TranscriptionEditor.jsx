import React, { useState } from 'react';
import { Edit3, Save, X, Clock, Plus, Trash2 } from 'lucide-react';
import TranscriptionViewer from './TranscriptionViewer';

const TranscriptionEditor = ({
  segments: initialSegments = [],
  currentTime = 0,
  onSeek,
  onSave,
  onCancel
}) => {
  const [segments, setSegments] = useState(initialSegments);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSegmentChange = (index, updatedSegment) => {
    const newSegments = [...segments];
    newSegments[index] = updatedSegment;
    setSegments(newSegments);
    setHasChanges(true);
  };

  const handleTimeChange = (index, field, value) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: parseFloat(value) || 0 };
    setSegments(newSegments);
    setHasChanges(true);
  };

  const handleAddSegment = () => {
    const lastSegment = segments[segments.length - 1];
    const newStart = lastSegment ? lastSegment.end + 0.1 : 0;
    setSegments([
      ...segments,
      { start: newStart, end: newStart + 5, text: 'New segment text' }
    ]);
    setHasChanges(true);
  };

  const handleDeleteSegment = (index) => {
    if (window.confirm('Are you sure you want to delete this segment?')) {
      const newSegments = segments.filter((_, i) => i !== index);
      setSegments(newSegments);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(segments);
    }
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSegments(initialSegments);
    setHasChanges(false);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  const formatTimeInput = (seconds) => {
    return seconds.toFixed(1);
  };

  if (!isEditing) {
    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h4 style={{ margin: 0, color: '#f8fafc' }}>Transcription</h4>
          <button
            className="btn btn-secondary"
            onClick={() => setIsEditing(true)}
            style={{ padding: '8px 16px' }}
          >
            <Edit3 size={16} /> Edit
          </button>
        </div>
        <TranscriptionViewer
          segments={segments}
          currentTime={currentTime}
          onSeek={onSeek}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h4 style={{ margin: 0, color: '#f8fafc' }}>Edit Transcription</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            style={{ padding: '8px 16px' }}
          >
            <X size={16} /> Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges}
            style={{ padding: '8px 16px' }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* Segments editor */}
      <div style={{
        maxHeight: 500,
        overflowY: 'auto',
        background: '#0f172a',
        borderRadius: 8,
        padding: 16
      }}>
        {segments.map((segment, index) => (
          <div
            key={index}
            style={{
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              background: '#1e293b',
              border: '1px solid #334155'
            }}
          >
            {/* Time inputs */}
            <div style={{
              display: 'flex',
              gap: 16,
              marginBottom: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} color="#64748b" />
                <label style={{ color: '#64748b', fontSize: 12 }}>Start:</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatTimeInput(segment.start)}
                  onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
                  style={{
                    width: 80,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: '#f8fafc',
                    fontSize: 12
                  }}
                />
                <span style={{ color: '#64748b', fontSize: 12 }}>s</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#64748b', fontSize: 12 }}>End:</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatTimeInput(segment.end)}
                  onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
                  style={{
                    width: 80,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: '#f8fafc',
                    fontSize: 12
                  }}
                />
                <span style={{ color: '#64748b', fontSize: 12 }}>s</span>
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => handleDeleteSegment(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: 4
                }}
                title="Delete segment"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Text input */}
            <textarea
              value={segment.text}
              onChange={(e) => handleSegmentChange(index, { ...segment, text: e.target.value })}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 4,
                padding: 12,
                color: '#f8fafc',
                fontSize: 14,
                lineHeight: 1.5,
                resize: 'vertical',
                minHeight: 80
              }}
            />
          </div>
        ))}

        {/* Add segment button */}
        <button
          onClick={handleAddSegment}
          style={{
            width: '100%',
            padding: 12,
            background: 'transparent',
            border: '2px dashed #334155',
            borderRadius: 8,
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Plus size={18} /> Add Segment
        </button>
      </div>
    </div>
  );
};

export default TranscriptionEditor;

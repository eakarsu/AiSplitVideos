import React from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw, Film, Pause, Play } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

const UploadItem = ({
  file,
  progress = 0,
  status = 'pending', // pending, uploading, completed, failed, paused
  error = null,
  onCancel,
  onRetry,
  onPause,
  onResume
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#16a34a" />;
      case 'failed':
        return <AlertCircle size={20} color="#dc2626" />;
      case 'uploading':
        return (
          <div className="upload-spinner" style={{
            width: 20,
            height: 20,
            border: '2px solid #334155',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        );
      case 'paused':
        return <Pause size={20} color="#f59e0b" />;
      default:
        return <Film size={20} color="#64748b" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#16a34a';
      case 'failed':
        return '#dc2626';
      case 'uploading':
        return '#6366f1';
      case 'paused':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: '#1e293b',
      borderRadius: 8,
      marginBottom: 8
    }}>
      {/* Status icon */}
      <div style={{ flexShrink: 0 }}>
        {getStatusIcon()}
      </div>

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4
        }}>
          <span style={{
            color: '#f8fafc',
            fontWeight: 500,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {file.name}
          </span>
          <span style={{ color: '#64748b', fontSize: 12, flexShrink: 0, marginLeft: 8 }}>
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Progress bar */}
        {(status === 'uploading' || status === 'paused' || status === 'pending') && (
          <div style={{
            height: 4,
            background: '#334155',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: getStatusColor(),
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        {/* Status text */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4
        }}>
          <span style={{ color: getStatusColor(), fontSize: 12 }}>
            {status === 'completed' && 'Uploaded'}
            {status === 'failed' && (error || 'Upload failed')}
            {status === 'uploading' && `Uploading... ${progress}%`}
            {status === 'paused' && `Paused - ${progress}%`}
            {status === 'pending' && 'Waiting...'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {status === 'uploading' && onPause && (
          <button
            onClick={() => onPause(file)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: 4
            }}
            title="Pause"
          >
            <Pause size={16} />
          </button>
        )}
        {status === 'paused' && onResume && (
          <button
            onClick={() => onResume(file)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: 4
            }}
            title="Resume"
          >
            <Play size={16} />
          </button>
        )}
        {status === 'failed' && onRetry && (
          <button
            onClick={() => onRetry(file)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              padding: 4
            }}
            title="Retry"
          >
            <RefreshCw size={16} />
          </button>
        )}
        {(status !== 'completed') && onCancel && (
          <button
            onClick={() => onCancel(file)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: 4
            }}
            title="Cancel"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadItem;

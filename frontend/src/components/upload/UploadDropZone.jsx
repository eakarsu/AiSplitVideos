import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film } from 'lucide-react';

const UploadDropZone = ({ onFilesAdded, disabled = false }) => {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.wmv']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    disabled,
    multiple: true,
    maxSize: 5 * 1024 * 1024 * 1024 // 5GB
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? '#6366f1' : isDragReject ? '#ef4444' : '#334155'}`,
        borderRadius: 12,
        padding: 40,
        textAlign: 'center',
        background: isDragActive ? 'rgba(99, 102, 241, 0.1)' : '#1e293b',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <input {...getInputProps()} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: isDragActive ? '#6366f1' : '#334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          {isDragActive ? (
            <Film size={32} color="#fff" />
          ) : (
            <Upload size={32} color="#94a3b8" />
          )}
        </div>
        <div>
          {isDragActive ? (
            <p style={{ color: '#6366f1', fontWeight: 600, margin: 0 }}>
              Drop your videos here...
            </p>
          ) : isDragReject ? (
            <p style={{ color: '#ef4444', fontWeight: 600, margin: 0 }}>
              Only video files are accepted
            </p>
          ) : (
            <>
              <p style={{ color: '#f8fafc', fontWeight: 600, margin: '0 0 8px 0' }}>
                Drag & drop video files here
              </p>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
                or click to browse
              </p>
            </>
          )}
        </div>
        <p style={{ color: '#64748b', margin: 0, fontSize: 12 }}>
          Supports: MP4, WebM, MOV, AVI, MKV (up to 5GB each)
        </p>
      </div>
    </div>
  );
};

export default UploadDropZone;

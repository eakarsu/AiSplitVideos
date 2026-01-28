import React, { useState } from 'react';
import axios from 'axios';
import { Download, FileText, Code, AlignLeft } from 'lucide-react';
import { API_URL } from '../../utils/api';

const SubtitleExport = ({ videoId, videoTitle, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('srt');

  const formats = [
    {
      id: 'srt',
      name: 'SRT',
      description: 'SubRip Subtitle - Most widely supported',
      icon: FileText,
      extension: '.srt'
    },
    {
      id: 'vtt',
      name: 'WebVTT',
      description: 'Web Video Text Tracks - For HTML5 video',
      icon: FileText,
      extension: '.vtt'
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured data - For developers',
      icon: Code,
      extension: '.json'
    },
    {
      id: 'txt',
      name: 'Plain Text',
      description: 'Text only - No timing information',
      icon: AlignLeft,
      extension: '.txt'
    }
  ];

  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(
        `${API_URL}/videos/${videoId}/transcription/export?format=${selectedFormat}`,
        { responseType: 'blob' }
      );

      // Create download link
      const format = formats.find(f => f.id === selectedFormat);
      const filename = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}${format.extension}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (onClose) onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export transcription');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Export Subtitles</h4>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 24
      }}>
        {formats.map(format => (
          <button
            key={format.id}
            onClick={() => setSelectedFormat(format.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: 16,
              background: selectedFormat === format.id ? 'rgba(99, 102, 241, 0.2)' : '#1e293b',
              border: selectedFormat === format.id ? '2px solid #6366f1' : '2px solid #334155',
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8
            }}>
              <format.icon size={18} color={selectedFormat === format.id ? '#818cf8' : '#64748b'} />
              <span style={{
                fontWeight: 600,
                color: selectedFormat === format.id ? '#f8fafc' : '#94a3b8'
              }}>
                {format.name}
              </span>
              <span style={{ color: '#64748b', fontSize: 12 }}>
                {format.extension}
              </span>
            </div>
            <span style={{ color: '#64748b', fontSize: 12 }}>
              {format.description}
            </span>
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8
      }}>
        {onClose && (
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '10px 20px' }}
          >
            Cancel
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={downloading}
          style={{ padding: '10px 20px' }}
        >
          <Download size={18} />
          {downloading ? 'Downloading...' : `Export as ${formats.find(f => f.id === selectedFormat).name}`}
        </button>
      </div>
    </div>
  );
};

export default SubtitleExport;

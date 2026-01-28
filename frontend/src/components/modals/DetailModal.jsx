import React, { useState } from 'react';
import {
  X, Play, Scissors, Eye, Trash2, Plus, Film, Download, Share2, Zap, Brain, FileText
} from 'lucide-react';
import { formatDuration, formatFileSize, formatDate } from '../../utils/formatters';
import { TranscriptionPanel } from '../transcription';

const DetailModal = ({ isOpen, onClose, title, item, type, onAction, onPlay, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !item) return null;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${item.title || item.name}"?`)) {
      onDelete?.(item);
    }
  };

  const renderField = (label, value, isWide = false) => {
    if (value === null || value === undefined) return null;
    return (
      <div className={`detail-field ${isWide ? 'detail-field-wide' : ''}`} key={label}>
        <span className="detail-field-label">{label}</span>
        <span className="detail-field-value">{value}</span>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'project':
        return (
          <>
            <div className="detail-header-image">
              <img src={item.thumbnail_url || 'https://via.placeholder.com/800x400'} alt={item.name} />
            </div>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Name', item.name)}
              {renderField('Description', item.description || '-', true)}
              {renderField('Status', <span className={`card-badge badge-${item.status}`}>{item.status}</span>)}
              {renderField('Video Count', item.video_count)}
              {renderField('Created', formatDate(item.created_at))}
              {renderField('Updated', formatDate(item.updated_at))}
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => onAction?.('view-videos')}><Eye size={18} /> View Videos</button>
              <button className="btn btn-secondary" onClick={() => onAction?.('add-video')}><Plus size={18} /> Add Video</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
            </div>
          </>
        );

      case 'video':
        return (
          <>
            <div className="detail-header-image video-preview" onClick={() => onPlay?.(item)} style={{ cursor: 'pointer' }}>
              <img src={item.thumbnail_url || 'https://via.placeholder.com/1280x720'} alt={item.title} />
              <div className="video-play-overlay visible">
                <button className="video-play-btn-large"><Play size={48} fill="white" /></button>
              </div>
              <div className="video-duration-badge">{formatDuration(item.duration)}</div>
            </div>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Title', item.title)}
              {renderField('Description', item.description || '-', true)}
              {renderField('Status', <span className={`card-badge badge-${item.status}`}>{item.status}</span>)}
              {renderField('Duration', formatDuration(item.duration))}
              {renderField('Resolution', item.resolution)}
              {renderField('Format', item.format)}
              {renderField('File Size', formatFileSize(item.file_size))}
              {renderField('Split Jobs', (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                    <Scissors size={12} style={{ marginRight: 4 }} /> {item.split_job_count || 0} splits
                  </span>
                  <span className="tag" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <Film size={12} style={{ marginRight: 4 }} /> {item.clips_count || 0} clips
                  </span>
                </span>
              ))}
              {renderField('Created', formatDate(item.created_at))}
            </div>
            {item.split_jobs && item.split_jobs.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 8 }}>Split History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.split_jobs.map(job => (
                    <div key={job.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#f8fafc', padding: '8px 12px', borderRadius: 8
                    }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{job.name}</span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: 8 }}>{job.split_type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`card-badge badge-${job.status}`}>{job.status}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.clips_generated || 0} clips</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => onPlay?.(item)}><Play size={18} /> Play</button>
              <button className="btn btn-secondary" onClick={() => onAction?.('split')}><Scissors size={18} /> New Split</button>
              {(item.split_job_count > 0 || item.clips_count > 0) && (
                <button className="btn btn-secondary" onClick={() => onAction?.('view-clips')}><Film size={18} /> View Clips ({item.clips_count || 0})</button>
              )}
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('transcription')}><FileText size={18} /> Transcription</button>
            </div>
          </>
        );

      case 'clip':
        return (
          <>
            <div className="detail-header-image video-preview" onClick={() => onPlay?.(item)} style={{ cursor: 'pointer' }}>
              <img src={item.thumbnail_url || 'https://via.placeholder.com/640x360'} alt={item.title} />
              <div className="video-play-overlay visible">
                <button className="video-play-btn-large"><Play size={48} fill="white" /></button>
              </div>
              <div className="video-duration-badge">{item.duration}s</div>
            </div>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Title', item.title)}
              {renderField('Description', item.description || '-', true)}
              {renderField('Source Video', item.video_title || '-')}
              {renderField('Start Time', formatDuration(item.start_time))}
              {renderField('End Time', formatDuration(item.end_time))}
              {renderField('Duration', `${item.duration}s`)}
              {renderField('Status', <span className={`card-badge badge-${item.status}`}>{item.status}</span>)}
              {renderField('AI Score', item.ai_score ? `${(item.ai_score * 100).toFixed(0)}%` : '-')}
              {renderField('AI Tags', item.ai_tags?.join(', ') || '-', true)}
              {renderField('Created', formatDate(item.created_at))}
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => onPlay?.(item)}><Play size={18} /> Play</button>
              <button className="btn btn-secondary" onClick={() => onAction?.('export')}><Download size={18} /> Export</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
            </div>
          </>
        );

      case 'split-job':
        return (
          <>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Job Name', item.name)}
              {renderField('Source Video', item.video_title || '-')}
              {renderField('Split Type', item.split_type)}
              {renderField('Status', <span className={`card-badge badge-${item.status}`}>{item.status}</span>)}
              {renderField('Progress', (
                <div className="detail-progress">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div>
                  <span>{item.progress}%</span>
                </div>
              ))}
              {renderField('Clips Generated', item.clips_generated)}
              {renderField('Settings', item.settings ? <pre className="detail-json">{JSON.stringify(item.settings, null, 2)}</pre> : '-', true)}
              {renderField('Error', item.error_message || '-', true)}
              {renderField('Started', formatDate(item.started_at))}
              {renderField('Completed', formatDate(item.completed_at))}
              {renderField('Created', formatDate(item.created_at))}
            </div>
            <div className="detail-actions">
              {item.status === 'pending' && <button className="btn btn-primary" onClick={() => onAction?.('start')}><Play size={18} /> Start Job</button>}
              {item.status === 'completed' && <button className="btn btn-primary" onClick={() => onAction?.('view-clips')}><Film size={18} /> View Clips</button>}
              {item.status === 'processing' && <button className="btn btn-secondary" disabled><Zap size={18} /> In Progress</button>}
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
            </div>
          </>
        );

      case 'template':
        return (
          <>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Name', item.name)}
              {renderField('Description', item.description || '-', true)}
              {renderField('Category', <span className="tag">{item.category}</span>)}
              {renderField('Split Type', item.split_type)}
              {renderField('Public', item.is_public ? 'Yes' : 'No')}
              {renderField('Usage Count', item.usage_count)}
              {renderField('Settings', item.settings ? <pre className="detail-json">{JSON.stringify(item.settings, null, 2)}</pre> : '-', true)}
              {renderField('Created', formatDate(item.created_at))}
              {renderField('Updated', formatDate(item.updated_at))}
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => onAction?.('use')}><Zap size={18} /> Use Template</button>
              <button className="btn btn-secondary"><Share2 size={18} /> Duplicate</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
            </div>
          </>
        );

      case 'ai-analysis':
        return (
          <>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Video', item.video_title || '-')}
              {renderField('Analysis Type', item.analysis_type?.replace(/_/g, ' '))}
              {renderField('Model', item.model_used)}
              {renderField('Status', <span className={`card-badge badge-${item.status}`}>{item.status}</span>)}
              {renderField('Confidence', item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}%` : '-')}
              {renderField('Processing Time', item.processing_time ? `${item.processing_time}s` : '-')}
              {renderField('Input Data', item.input_data ? <pre className="detail-json">{JSON.stringify(item.input_data, null, 2)}</pre> : '-', true)}
              {renderField('Output Data', item.output_data ? <pre className="detail-json">{JSON.stringify(item.output_data, null, 2)}</pre> : '-', true)}
              {renderField('Error', item.error_message || '-', true)}
              {renderField('Created', formatDate(item.created_at))}
            </div>
            <div className="detail-actions">
              {item.status === 'completed' && <button className="btn btn-primary"><Eye size={18} /> View Results</button>}
              {item.status === 'processing' && <button className="btn btn-secondary" disabled><Zap size={18} /> In Progress</button>}
              <button className="btn btn-secondary" onClick={() => onAction?.('rerun')}><Brain size={18} /> Run Again</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
            </div>
          </>
        );

      case 'export':
        return (
          <>
            <div className="detail-fields">
              {renderField('ID', item.id)}
              {renderField('Name', item.name)}
              {renderField('Source Clip', item.clip_title || '-')}
              {renderField('Source Video', item.video_title || '-')}
              {renderField('Format', item.format?.toUpperCase())}
              {renderField('Resolution', item.resolution)}
              {renderField('File Size', formatFileSize(item.file_size))}
              {renderField('Status', <span className={`card-badge badge-${item.status}`}>{item.status}</span>)}
              {renderField('Progress', (
                <div className="detail-progress">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div>
                  <span>{item.progress}%</span>
                </div>
              ))}
              {renderField('Settings', item.settings ? <pre className="detail-json">{JSON.stringify(item.settings, null, 2)}</pre> : '-', true)}
              {renderField('File URL', item.file_url || '-')}
              {renderField('Completed', formatDate(item.completed_at))}
              {renderField('Created', formatDate(item.created_at))}
            </div>
            <div className="detail-actions">
              {item.status === 'completed' && <button className="btn btn-primary"><Download size={18} /> Download</button>}
              {item.status === 'processing' && <button className="btn btn-secondary" disabled><Zap size={18} /> In Progress</button>}
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={18} /> Delete</button>
            </div>
          </>
        );

      default:
        return <div className="detail-fields">{Object.entries(item).map(([k, v]) => renderField(k, String(v)))}</div>;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body" onClick={(e) => e.stopPropagation()}>
          {type === 'video' && activeTab === 'transcription' ? (
            <div>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveTab('details')}
                style={{ marginBottom: 16 }}
              >
                Back to Details
              </button>
              <TranscriptionPanel
                videoId={item.id}
                videoTitle={item.title}
              />
            </div>
          ) : renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Video, FolderOpen, Scissors, Film, Layout as LayoutIcon, Brain, Download,
  Home, LogOut, Plus, X, Play, Clock, FileVideo, Settings, Eye, Trash2,
  Share2, Zap, CheckCircle, AlertCircle, Loader, BarChart3, Upload
} from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

// Auth Context
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper Functions
const formatDuration = (seconds) => {
  if (!seconds) return '-';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} bytes`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

const formatShortDuration = (seconds) => {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = (seconds || 0) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/demo-credentials`);
      setEmail(res.data.email);
      setPassword(res.data.password);
    } catch {
      setEmail('demo@aisplitvideo.com');
      setPassword('demo123456');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <Video size={48} color="#6366f1" />
          <h1>AI Split Videos</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <button type="button" className="btn btn-fill-demo" onClick={handleFillDemo}>
            <Settings size={18} />
            Fill Demo Credentials
          </button>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Layout with Sidebar
const Layout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/videos', icon: Video, label: 'Videos' },
    { path: '/split-jobs', icon: Scissors, label: 'Split Jobs' },
    { path: '/clips', icon: Film, label: 'Clips' },
    { path: '/templates', icon: LayoutIcon, label: 'Templates' },
    { path: '/ai-analysis', icon: Brain, label: 'AI Analysis' },
    { path: '/exports', icon: Download, label: 'Exports' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Video size={32} />
          <h1>AI Split Videos</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          <div className="nav-item" onClick={logout} style={{ marginTop: 'auto' }}>
            <LogOut size={20} />
            Logout
          </div>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

// Status Icon Component - static icons, no spinning
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'completed':
    case 'processed':
    case 'active':
    case 'generated':
      return <CheckCircle size={16} className="status-icon status-success" />;
    case 'processing':
      return <Zap size={16} className="status-icon" style={{ color: '#6366f1' }} />;
    case 'pending':
      return <Clock size={16} className="status-icon status-pending" />;
    case 'failed':
      return <AlertCircle size={16} className="status-icon status-failed" />;
    default:
      return null;
  }
};

// Video Player Modal - supports YouTube and direct video URLs
const VideoPlayerModal = ({ isOpen, onClose, video }) => {
  if (!isOpen || !video) return null;

  let videoUrl = video.file_url || video.url || '';

  // If it's a local upload path, prepend the API URL
  if (videoUrl.startsWith('/uploads/')) {
    videoUrl = `http://localhost:3001${videoUrl}`;
  }

  // Check if it's a YouTube video ID or URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    // If it's just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    // Extract from various YouTube URL formats
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(videoUrl);

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{video.title || 'Video Player'}</h2>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }} onClick={(e) => e.stopPropagation()}>
          {youtubeId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            </div>
          ) : (
            <video
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '70vh', background: '#000' }}
              src={videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              onClick={(e) => e.stopPropagation()}
            >
              Your browser does not support the video tag.
            </video>
          )}
          <div style={{ padding: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {video.description || 'No description'}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', color: '#94a3b8', fontSize: '0.75rem' }}>
              <span>Duration: {formatDuration(video.duration)}</span>
              <span>Resolution: {video.resolution || '-'}</span>
              <span>Format: {video.format || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Universal Detail Modal
const DetailModal = ({ isOpen, onClose, title, item, type, onAction, onPlay, onDelete }) => {
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
        <div className="modal-body" onClick={(e) => e.stopPropagation()}>{renderContent()}</div>
      </div>
    </div>
  );
};

// Create Modal Component
const CreateModal = ({ isOpen, onClose, title, fields, onSubmit }) => {
  const [values, setValues] = useState({});

  const handleChange = (name, value) => {
    setValues({ ...values, [name]: value });
  };

  const handleSubmit = () => {
    onSubmit(values);
    setValues({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body">
          {fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea className="form-input" value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)} rows={3} />
              ) : field.type === 'select' ? (
                <select className="form-input" value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}>
                  <option value="">Select...</option>
                  {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type={field.type} className="form-input" value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} />
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
};

// Split Video Modal - Configure and start video splitting
const SplitVideoModal = ({ isOpen, onClose, video, onSplitStarted }) => {
  const presets = {
    'social': { label: 'Social Media (15s - 60s)', min: 15, max: 60 },
    'short': { label: 'Short Clips (1 - 5 min)', min: 60, max: 300 },
    'medium': { label: 'Medium Segments (5 - 15 min)', min: 300, max: 900 },
    'movie': { label: 'Movie Chapters (15 - 30 min)', min: 900, max: 1800 },
    'custom': { label: 'Custom', min: 60, max: 600 }
  };

  const [preset, setPreset] = useState('medium');
  const [settings, setSettings] = useState({
    name: '',
    split_type: 'smart',
    minClipDuration: 300,
    maxClipDuration: 900
  });
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (video) {
      setSettings(s => ({ ...s, name: `Split - ${video.title}` }));
    }
  }, [video]);

  // Update settings when preset changes
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setSettings(s => ({
        ...s,
        minClipDuration: presets[newPreset].min,
        maxClipDuration: presets[newPreset].max
      }));
    }
  };

  useEffect(() => {
    let interval;
    if (jobId && status === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/split-jobs/${jobId}/progress`);
          setProgress(res.data.progress);
          if (res.data.status === 'completed') {
            setStatus('completed');
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setStatus('failed');
            clearInterval(interval);
          }
        } catch (e) {
          console.error('Progress check failed:', e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleStartSplit = async () => {
    setLoading(true);
    try {
      // Create split job
      const createRes = await axios.post(`${API_URL}/split-jobs`, {
        video_id: video.id,
        name: settings.name,
        split_type: settings.split_type,
        settings: {
          minClipDuration: settings.minClipDuration,
          maxClipDuration: settings.maxClipDuration
        }
      });

      const newJobId = createRes.data.id;
      setJobId(newJobId);

      // Start the job
      await axios.post(`${API_URL}/split-jobs/${newJobId}/start`);
      setStatus('processing');
      setProgress(0);

    } catch (error) {
      console.error('Split failed:', error);
      alert('Failed to start split job');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (status === 'completed' && onSplitStarted) {
      onSplitStarted(jobId);
    }
    setJobId(null);
    setStatus('');
    setProgress(0);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !video) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && handleClose()}>
      <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title"><Scissors size={24} /> Split Video</h2>
          {!loading && <button className="modal-close" onClick={handleClose}><X size={24} /></button>}
        </div>
        <div className="modal-body">
          {!jobId ? (
            <>
              <div className="detail-field" style={{ marginBottom: 16 }}>
                <span className="detail-field-label">Video</span>
                <span className="detail-field-value">{video.title} ({formatDuration(video.duration)})</span>
              </div>

              <div className="form-group">
                <label className="form-label">Job Name</label>
                <input type="text" className="form-input" value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Clip Duration Preset</label>
                <select className="form-input" value={preset} onChange={(e) => handlePresetChange(e.target.value)}>
                  {Object.entries(presets).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Min Clip Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="form-input" value={settings.minClipDuration}
                      onChange={(e) => { setPreset('custom'); setSettings({ ...settings, minClipDuration: parseInt(e.target.value) || 60 }); }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>sec ({Math.floor(settings.minClipDuration / 60)}m)</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Clip Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="form-input" value={settings.maxClipDuration}
                      onChange={(e) => { setPreset('custom'); setSettings({ ...settings, maxClipDuration: parseInt(e.target.value) || 600 }); }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>sec ({Math.floor(settings.maxClipDuration / 60)}m)</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Split Type</label>
                <select className="form-input" value={settings.split_type}
                  onChange={(e) => setSettings({ ...settings, split_type: e.target.value })}>
                  <option value="smart">Smart Split (Silence Detection)</option>
                  <option value="time">Time-based (Fixed Intervals)</option>
                </select>
              </div>

              <div style={{ background: '#e0f2fe', padding: 12, borderRadius: 8, marginTop: 16 }}>
                <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0 }}>
                  <Film size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  <strong>Estimated clips:</strong> ~{Math.max(1, Math.ceil(video.duration / settings.maxClipDuration))} clips
                  ({Math.floor(settings.minClipDuration / 60)}-{Math.floor(settings.maxClipDuration / 60)} min each)
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              {status === 'processing' && (
                <>
                  <Loader size={48} className="status-processing" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8 }}>Splitting Video...</h3>
                  <p style={{ color: '#64748b', marginBottom: 16 }}>Detecting silence gaps and creating clips</p>
                  <div className="progress-bar" style={{ height: 12, marginBottom: 8 }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p style={{ fontWeight: 600, color: '#6366f1' }}>{progress}%</p>
                </>
              )}
              {status === 'completed' && (
                <>
                  <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8, color: '#16a34a' }}>Split Complete!</h3>
                  <p style={{ color: '#64748b' }}>Your clips have been created successfully.</p>
                </>
              )}
              {status === 'failed' && (
                <>
                  <AlertCircle size={48} color="#dc2626" style={{ marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8, color: '#dc2626' }}>Split Failed</h3>
                  <p style={{ color: '#64748b' }}>There was an error processing the video.</p>
                </>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {!jobId ? (
            <>
              <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStartSplit} disabled={loading}>
                <Scissors size={18} /> Start Split
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleClose} disabled={status === 'processing'}>
              {status === 'completed' ? 'View Clips' : status === 'failed' ? 'Close' : 'Processing...'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [splitVideo, setSplitVideo] = useState(null);
  const navigate = useNavigate();

  const handleDeleteVideo = async (video) => {
    try {
      await axios.delete(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(null);
      setRecentVideos(recentVideos.filter(v => v.id !== video.id));
      setStats({ ...stats, videos: (stats.videos || 1) - 1 });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete video');
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [videos, projects, clips, jobs, templates, analyses, exports] = await Promise.all([
          axios.get(`${API_URL}/videos?limit=6`),
          axios.get(`${API_URL}/projects`),
          axios.get(`${API_URL}/clips`),
          axios.get(`${API_URL}/split-jobs`),
          axios.get(`${API_URL}/templates`),
          axios.get(`${API_URL}/ai-analysis`),
          axios.get(`${API_URL}/exports`)
        ]);
        setStats({
          videos: videos.data.total,
          projects: projects.data.total,
          clips: clips.data.total,
          jobs: jobs.data.total,
          templates: templates.data.total,
          analyses: analyses.data.total,
          exports: exports.data.total
        });
        setRecentVideos(videos.data.videos);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="btn btn-primary" onClick={() => navigate('/videos')}><Upload size={18} /> Upload Video</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/videos')}><Video size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.videos || 0}</div><div className="stat-label">Videos</div></div></div>
        <div className="stat-card" onClick={() => navigate('/projects')}><FolderOpen size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.projects || 0}</div><div className="stat-label">Projects</div></div></div>
        <div className="stat-card" onClick={() => navigate('/clips')}><Film size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.clips || 0}</div><div className="stat-label">Clips</div></div></div>
        <div className="stat-card" onClick={() => navigate('/split-jobs')}><Scissors size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.jobs || 0}</div><div className="stat-label">Split Jobs</div></div></div>
        <div className="stat-card" onClick={() => navigate('/templates')}><LayoutIcon size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.templates || 0}</div><div className="stat-label">Templates</div></div></div>
        <div className="stat-card" onClick={() => navigate('/ai-analysis')}><Brain size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.analyses || 0}</div><div className="stat-label">AI Analyses</div></div></div>
        <div className="stat-card" onClick={() => navigate('/exports')}><Download size={24} className="stat-icon" /><div className="stat-info"><div className="stat-value">{stats.exports || 0}</div><div className="stat-label">Exports</div></div></div>
      </div>

      <h2 style={{ marginBottom: 16 }}>Recent Videos</h2>
      <div className="cards-grid">
        {recentVideos.map((video) => (
          <div key={video.id} className="card" onClick={() => setSelectedVideo(video)}>
            <div className="card-image-container">
              <img src={video.thumbnail_url || 'https://via.placeholder.com/640x360'} alt={video.title} className="card-image" />
              <div className="video-play-overlay" onClick={(e) => { e.stopPropagation(); setPlayingVideo(video); }}>
                <button className="video-play-btn"><Play size={32} fill="white" /></button>
              </div>
              <div className="video-duration-badge">{formatShortDuration(video.duration)}</div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{video.title}</h3>
              <p className="card-description">{video.description || 'No description'}</p>
              <div className="card-meta">
                <span><Clock size={14} /> {formatDuration(video.duration)}</span>
                <span className={`card-badge badge-${video.status}`}>{video.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DetailModal isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)}
        title={selectedVideo?.title} item={selectedVideo} type="video"
        onAction={(action) => {
          if (action === 'split') {
            setSplitVideo(selectedVideo);
            setSelectedVideo(null);
          } else if (action === 'analyze') {
            setSelectedVideo(null);
            navigate('/ai-analysis');
          } else {
            setSelectedVideo(null);
          }
        }}
        onPlay={(video) => { setSelectedVideo(null); setPlayingVideo(video); }}
        onDelete={handleDeleteVideo} />

      <VideoPlayerModal isOpen={!!playingVideo} onClose={() => setPlayingVideo(null)} video={playingVideo} />

      <SplitVideoModal
        isOpen={!!splitVideo}
        onClose={() => setSplitVideo(null)}
        video={splitVideo}
        onSplitStarted={(jobId) => {
          setSplitVideo(null);
          navigate('/clips');
        }}
      />
    </div>
  );
};

// Generic Feature Page
const FeaturePage = ({ title, endpoint, type, cardRender, fields }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/${endpoint}`);
      const key = Object.keys(res.data).find(k => Array.isArray(res.data[k]));
      setItems(res.data[key] || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [endpoint]);

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_URL}/${endpoint}`, data);
      fetchItems();
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleDelete = async (item) => {
    try {
      await axios.delete(`${API_URL}/${endpoint}/${item.id}`);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete item');
    }
  };

  const handleAction = (action) => {
    setSelectedItem(null);
    switch (action) {
      case 'view-videos': navigate('/videos'); break;
      case 'split': navigate('/split-jobs'); break;
      case 'analyze': navigate('/ai-analysis'); break;
      case 'export': navigate('/exports'); break;
      case 'view-clips': navigate('/clips'); break;
      default: break;
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{title} ({total})</h1>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={18} /> New {title.slice(0, -1)}</button>
      </div>

      <div className="cards-grid">
        {items.map((item) => cardRender(item, () => setSelectedItem(item), (video) => setPlayingVideo(video)))}
      </div>

      <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || selectedItem?.name || 'Details'} item={selectedItem} type={type} onAction={handleAction}
        onPlay={(video) => { setSelectedItem(null); setPlayingVideo(video); }}
        onDelete={handleDelete} />

      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        title={`New ${title.slice(0, -1)}`} fields={fields} onSubmit={handleCreate} />

      <VideoPlayerModal isOpen={!!playingVideo} onClose={() => setPlayingVideo(null)} video={playingVideo} />
    </div>
  );
};

// Page Components
const ProjectsPage = () => (
  <FeaturePage title="Projects" endpoint="projects" type="project"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-image-container"><img src={item.thumbnail_url || 'https://via.placeholder.com/400x300'} alt={item.name} className="card-image" /></div>
        <div className="card-content">
          <h3 className="card-title">{item.name}</h3>
          <p className="card-description">{item.description || 'No description'}</p>
          <div className="card-meta"><span><FileVideo size={14} /> {item.video_count} videos</span><span className={`card-badge badge-${item.status}`}>{item.status}</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Project Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'archived'] }
    ]}
  />
);

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [splitVideo, setSplitVideo] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_URL}/videos`);
      setVideos(res.data.videos || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Fetch videos error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  // Fetch full video details including split_jobs when clicking a video
  const handleVideoClick = async (video) => {
    try {
      const res = await axios.get(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(res.data);
    } catch (error) {
      console.error('Fetch video details error:', error);
      setSelectedVideo(video); // Fallback to basic data
    }
  };

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_URL}/videos`, data);
      fetchVideos();
    } catch (error) {
      console.error('Create video error:', error);
    }
  };

  const handleDelete = async (video) => {
    try {
      await axios.delete(`${API_URL}/videos/${video.id}`);
      setSelectedVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Delete video error:', error);
      alert('Failed to delete video');
    }
  };

  const handleAction = (action) => {
    if (action === 'split') {
      setSplitVideo(selectedVideo);
      setSelectedVideo(null);
    } else if (action === 'view-clips') {
      setSelectedVideo(null);
      navigate('/clips');
    } else if (action === 'analyze') {
      setSelectedVideo(null);
      navigate('/ai-analysis');
    } else {
      setSelectedVideo(null);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Videos ({total})</h1>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={18} /> New Video</button>
      </div>

      <div className="cards-grid">
        {videos.map((video) => (
          <div key={video.id} className="card" onClick={() => handleVideoClick(video)}>
            <div className="card-image-container">
              <img src={video.thumbnail_url || 'https://via.placeholder.com/640x360'} alt={video.title} className="card-image" />
              <div className="video-play-overlay" onClick={(e) => { e.stopPropagation(); setPlayingVideo(video); }}>
                <button className="video-play-btn"><Play size={32} fill="white" /></button>
              </div>
              <div className="video-duration-badge">{formatShortDuration(video.duration)}</div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{video.title}</h3>
              <p className="card-description">{video.description || 'No description'}</p>
              <div className="card-meta">
                <span><Clock size={14} /> {formatDuration(video.duration)}</span>
                {(video.split_job_count > 0 || video.clips_count > 0) && (
                  <span style={{ display: 'flex', gap: 4 }}>
                    <span className="tag" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{video.split_job_count || 0} splits</span>
                    <span className="tag" style={{ padding: '2px 6px', fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a' }}>{video.clips_count || 0} clips</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DetailModal isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)}
        title={selectedVideo?.title} item={selectedVideo} type="video"
        onAction={handleAction}
        onPlay={(video) => { setSelectedVideo(null); setPlayingVideo(video); }}
        onDelete={handleDelete} />

      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        title="New Video"
        fields={[
          { name: 'title', label: 'Video Title', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'duration', label: 'Duration (seconds)', type: 'number' },
          { name: 'resolution', label: 'Resolution', type: 'text' }
        ]}
        onSubmit={handleCreate} />

      <VideoPlayerModal isOpen={!!playingVideo} onClose={() => setPlayingVideo(null)} video={playingVideo} />

      <SplitVideoModal
        isOpen={!!splitVideo}
        onClose={() => setSplitVideo(null)}
        video={splitVideo}
        onSplitStarted={(jobId) => {
          setSplitVideo(null);
          navigate('/clips');
        }}
      />
    </div>
  );
};

const ClipsPage = () => (
  <FeaturePage title="Clips" endpoint="clips" type="clip"
    cardRender={(item, onClick, onPlay) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-image-container">
          <img src={item.thumbnail_url || 'https://via.placeholder.com/320x180'} alt={item.title} className="card-image" />
          <div className="video-play-overlay" onClick={(e) => { e.stopPropagation(); onPlay(item); }}>
            <button className="video-play-btn"><Play size={24} fill="white" /></button>
          </div>
          <div className="video-duration-badge">{item.duration}s</div>
        </div>
        <div className="card-content">
          <h3 className="card-title">{item.title}</h3>
          <div className="tags-row">{item.ai_tags?.slice(0, 3).map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
          <div className="card-meta"><span><Clock size={14} /> {item.duration}s</span><span className="score-badge">Score: {((item.ai_score || 0) * 100).toFixed(0)}%</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'title', label: 'Clip Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'start_time', label: 'Start Time (seconds)', type: 'number' },
      { name: 'end_time', label: 'End Time (seconds)', type: 'number' }
    ]}
  />
);

const SplitJobsPage = () => (
  <FeaturePage title="Split Jobs" endpoint="split-jobs" type="split-job"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content">
          <div className="card-header-row"><h3 className="card-title">{item.name}</h3><StatusIcon status={item.status} /></div>
          <p className="card-description">Video: {item.video_title || '-'}</p>
          <div className="card-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div><span>{item.progress}%</span></div>
          <div className="card-meta"><span className="tag">{item.split_type}</span><span>{item.clips_generated} clips</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Job Name', type: 'text' },
      { name: 'split_type', label: 'Split Type', type: 'select', options: ['scene', 'time', 'ai_highlight', 'silence', 'manual'] }
    ]}
  />
);

const TemplatesPage = () => (
  <FeaturePage title="Templates" endpoint="templates" type="template"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content template-card-content">
          <div className="template-icon"><LayoutIcon size={32} /></div>
          <h3 className="card-title">{item.name}</h3>
          <p className="card-description">{item.description}</p>
          <div className="card-meta"><span className="tag">{item.category}</span><span><BarChart3 size={14} /> {item.usage_count} uses</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Template Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['social', 'podcast', 'education', 'gaming', 'music', 'general'] },
      { name: 'split_type', label: 'Split Type', type: 'select', options: ['scene', 'time', 'ai_highlight', 'silence', 'manual'] }
    ]}
  />
);

const AIAnalysisPage = () => (
  <FeaturePage title="AI Analyses" endpoint="ai-analysis" type="ai-analysis"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content">
          <div className="card-header-row"><h3 className="card-title">{item.analysis_type.replace(/_/g, ' ')}</h3><StatusIcon status={item.status} /></div>
          <p className="card-description">Video: {item.video_title || '-'}</p>
          <p className="card-description">Model: {item.model_used}</p>
          <div className="card-meta">
            <span>{item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}% confidence` : '-'}</span>
            <span>{item.processing_time ? `${item.processing_time}s` : '-'}</span>
          </div>
        </div>
      </div>
    )}
    fields={[
      { name: 'analysis_type', label: 'Analysis Type', type: 'select', options: ['scene_detection', 'highlight_detection', 'sentiment_analysis', 'keyword_extraction', 'viral_potential'] },
      { name: 'model_used', label: 'AI Model', type: 'select', options: ['openai/gpt-4-turbo', 'anthropic/claude-3-opus', 'anthropic/claude-3-haiku'] }
    ]}
  />
);

const ExportsPage = () => (
  <FeaturePage title="Exports" endpoint="exports" type="export"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content">
          <div className="card-header-row"><h3 className="card-title">{item.name}</h3><StatusIcon status={item.status} /></div>
          <p className="card-description">{item.format.toUpperCase()} • {item.resolution}</p>
          {item.status !== 'completed' ? (
            <div className="card-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div><span>{item.progress}%</span></div>
          ) : (
            <p className="card-description">{formatFileSize(item.file_size)}</p>
          )}
          <div className="card-meta"><span className={`card-badge badge-${item.status}`}>{item.status}</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Export Name', type: 'text' },
      { name: 'format', label: 'Format', type: 'select', options: ['mp4', 'webm', 'gif', 'mp3'] },
      { name: 'resolution', label: 'Resolution', type: 'select', options: ['1920x1080', '1080x1920', '1280x720', '1080x1080'] }
    ]}
  />
);

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
            <Route path="/split-jobs" element={<ProtectedRoute><SplitJobsPage /></ProtectedRoute>} />
            <Route path="/clips" element={<ProtectedRoute><ClipsPage /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
            <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysisPage /></ProtectedRoute>} />
            <Route path="/exports" element={<ProtectedRoute><ExportsPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

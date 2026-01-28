import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileVideo, FolderOpen } from 'lucide-react';
import { API_URL } from '../utils/api';
import { LoadingSpinner } from '../components/common';
import { CreateModal } from '../components/modals';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects`);
      setProjects(res.data.projects || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Fetch projects error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/projects`, data);
      // Navigate to the new project
      navigate(`/projects/${res.data.id}`);
    } catch (error) {
      console.error('Create project error:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects ({total})</h1>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="cards-grid">
        {projects.map(item => (
          <div
            key={item.id}
            className="card"
            onClick={() => navigate(`/projects/${item.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-image-container">
              <img
                src={item.thumbnail_url || 'https://via.placeholder.com/400x300'}
                alt={item.name}
                className="card-image"
              />
            </div>
            <div className="card-content">
              <h3 className="card-title">{item.name}</h3>
              <p className="card-description">{item.description || 'No description'}</p>
              <div className="card-meta">
                <span><FileVideo size={14} /> {item.video_count || 0} videos</span>
                <span className={`card-badge badge-${item.status}`}>{item.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <FolderOpen size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ marginBottom: 8 }}>No Projects Yet</h3>
          <p style={{ marginBottom: 24 }}>Create your first project to organize your videos</p>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={18} /> Create Your First Project
          </button>
        </div>
      )}

      <CreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Project"
        fields={[
          { name: 'name', label: 'Project Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'archived'] }
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default ProjectsPage;

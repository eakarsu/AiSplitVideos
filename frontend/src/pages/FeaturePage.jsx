import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { API_URL } from '../utils/api';
import { LoadingSpinner } from '../components/common';
import { EnhancedVideoPlayer } from '../components/video';
import { DetailModal, CreateModal } from '../components/modals';

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

  if (loading) return <LoadingSpinner />;

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

      <EnhancedVideoPlayer isOpen={!!playingVideo} onClose={() => setPlayingVideo(null)} video={playingVideo} />
    </div>
  );
};

export default FeaturePage;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Download, FileText } from 'lucide-react';
import { API_URL } from '../utils/api';
import { LoadingSpinner, EmptyState, PaginationControls, SortDropdown, BulkActionBar } from '../components/common';
import { EnhancedVideoPlayer } from '../components/video';
import { DetailModal, CreateModal } from '../components/modals';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const FeaturePage = ({ title, endpoint, type, cardRender, fields, sortOptions, emptyIcon }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (search) params.set('search', search);
      const res = await axios.get(`${API_URL}/${endpoint}?${params}`);
      const key = Object.keys(res.data).find(k => Array.isArray(res.data[k]));
      setItems(res.data[key] || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, pageSize, sortBy, sortOrder, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_URL}/${endpoint}`, data);
      toast.success(`${title.slice(0, -1)} created successfully`);
      fetchItems();
    } catch (error) {
      toast.error('Failed to create item');
    }
  };

  const handleEdit = async (data) => {
    try {
      await axios.put(`${API_URL}/${endpoint}/${editItem.id}`, data);
      toast.success('Updated successfully');
      setEditItem(null);
      fetchItems();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm('Delete Item', `Are you sure you want to delete "${item.title || item.name}"?`);
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/${endpoint}/${item.id}`);
      toast.success('Deleted successfully');
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm('Bulk Delete', `Are you sure you want to delete ${selectedIds.size} items?`);
    if (!confirmed) return;
    try {
      await axios.post(`${API_URL}/${endpoint}/bulk/delete`, { ids: [...selectedIds] });
      toast.success(`${selectedIds.size} items deleted`);
      setSelectedIds(new Set());
      fetchItems();
    } catch (error) {
      toast.error('Failed to bulk delete');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get(`${API_URL}/${endpoint}/export/csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${endpoint}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAction = (action) => {
    setSelectedItem(null);
    switch (action) {
      case 'view-videos': navigate('/videos'); break;
      case 'split': navigate('/split-jobs'); break;
      case 'analyze': navigate('/ai-analysis'); break;
      case 'export': navigate('/exports'); break;
      case 'view-clips': navigate('/clips'); break;
      case 'edit': setEditItem(selectedItem); break;
      default: break;
    }
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  if (loading) return <LoadingSpinner />;

  const defaultSortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Last Updated' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{title} ({total})</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} title="Export CSV"><Download size={16} /> CSV</button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={18} /> New {title.slice(0, -1)}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input type="text" className="form-input" placeholder={`Search ${title.toLowerCase()}...`}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <SortDropdown options={sortOptions || defaultSortOptions} sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon || FileText} title={`No ${title} Found`}
          description={search ? 'Try a different search term' : `Create your first ${title.toLowerCase().slice(0, -1)}`}
          actionLabel={!search ? `Create ${title.slice(0, -1)}` : undefined}
          onAction={!search ? () => setCreateOpen(true) : undefined} />
      ) : (
        <>
          <div className="cards-grid">
            {items.map((item) => (
              <div key={item.id} style={{ position: 'relative' }}>
                <input type="checkbox" className="card-checkbox" checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)} onClick={e => e.stopPropagation()} />
                {cardRender(item, () => setSelectedItem(item), (video) => setPlayingVideo(video))}
              </div>
            ))}
          </div>

          <PaginationControls page={page} pageSize={pageSize} total={total}
            onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}

      <BulkActionBar selectedCount={selectedIds.size} onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())} />

      <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || selectedItem?.name || 'Details'} item={selectedItem} type={type}
        onAction={handleAction}
        onPlay={(video) => { setSelectedItem(null); setPlayingVideo(video); }}
        onDelete={handleDelete}
        onEdit={(item) => { setSelectedItem(null); setEditItem(item); }} />

      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        title={`New ${title.slice(0, -1)}`} fields={fields} onSubmit={handleCreate} />

      <CreateModal isOpen={!!editItem} onClose={() => setEditItem(null)}
        title={`Edit ${title.slice(0, -1)}`} fields={fields} onSubmit={handleEdit}
        initialValues={editItem} />

      <EnhancedVideoPlayer isOpen={!!playingVideo} onClose={() => setPlayingVideo(null)} video={playingVideo} />
    </div>
  );
};

export default FeaturePage;

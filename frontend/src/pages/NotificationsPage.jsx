import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { LoadingSpinner, EmptyState, PaginationControls } from '../components/common';
import { formatDate } from '../utils/formatters';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications?limit=${pageSize}&offset=${(page - 1) * pageSize}`);
      setNotifications(res.data.notifications || []);
      setTotal(res.data.total || 0);
      setUnread(res.data.unread || 0);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page, pageSize]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      fetchNotifications();
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      toast.success('All marked as read');
      fetchNotifications();
    } catch { toast.error('Failed to mark all as read'); }
  };

  const deleteNotification = async (id) => {
    const confirmed = await confirm('Delete Notification', 'Are you sure you want to delete this notification?');
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch { toast.error('Failed to delete notification'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications ({total}) {unread > 0 && <span className="tag" style={{ marginLeft: 8 }}>{unread} unread</span>}</h1>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}><CheckCheck size={16} /> Mark All Read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No Notifications" description="You're all caught up!" />
      ) : (
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-row ${!n.read ? 'notification-unread' : ''}`}>
              <div className={`notification-dot notification-dot-${n.type}`} />
              <div className="notification-row-content">
                <div className="notification-row-title">{n.title}</div>
                <div className="notification-row-message">{n.message}</div>
                <div className="notification-row-meta">{formatDate(n.created_at)}</div>
              </div>
              <div className="notification-row-actions">
                {!n.read && <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => markAsRead(n.id)}><Check size={14} /></button>}
                <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => deleteNotification(n.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationControls page={page} pageSize={pageSize} total={total}
        onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
};

export default NotificationsPage;

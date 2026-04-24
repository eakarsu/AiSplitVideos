import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../utils/api';

const NotificationBell = () => {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications?limit=5`);
      setUnread(res.data.unread || 0);
      setNotifications(res.data.notifications?.slice(0, 5) || []);
    } catch {}
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try { await axios.put(`${API_URL}/notifications/${n.id}/read`); } catch {}
    }
    setIsOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button className="notification-bell-btn" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}>View All</button>
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty">No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notification-item ${!n.read ? 'notification-unread' : ''}`}
                onClick={() => handleClick(n)}>
                <div className={`notification-dot notification-dot-${n.type}`} />
                <div className="notification-content">
                  <div className="notification-title">{n.title}</div>
                  <div className="notification-message">{n.message?.substring(0, 60)}...</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

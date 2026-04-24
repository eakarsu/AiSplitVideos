import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Video, FolderOpen, Scissors, Film, Layout as LayoutIcon, Brain, Download,
  Home, LogOut, Shield, Bell, User, Menu, X, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { NotificationBell } from '../common';

const iconMap = {
  Home, FolderOpen, Video, Scissors, Film, LayoutIcon, Brain, Download, Shield, Bell, User
};

const navItems = [
  { path: '/', icon: 'Home', label: 'Dashboard' },
  { path: '/projects', icon: 'FolderOpen', label: 'Projects' },
  { path: '/videos', icon: 'Video', label: 'Videos' },
  { path: '/split-jobs', icon: 'Scissors', label: 'Split Jobs' },
  { path: '/clips', icon: 'Film', label: 'Clips' },
  { path: '/templates', icon: 'LayoutIcon', label: 'Templates' },
  { path: '/ai-analysis', icon: 'Brain', label: 'AI Analysis' },
  { path: '/exports', icon: 'Download', label: 'Exports' },
  { path: '/roles', icon: 'Shield', label: 'Roles' },
  { path: '/notifications', icon: 'Bell', label: 'Notifications' },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    const confirmed = await confirm('Logout', 'Are you sure you want to logout?');
    if (confirmed) logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="layout">
      {/* Mobile hamburger */}
      <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <Video size={32} />
          <h1>AI Split Videos</h1>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User profile section */}
        <div className="sidebar-user" onClick={() => { navigate('/profile'); setSidebarOpen(false); }}>
          <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
            alt={user?.name} className="sidebar-avatar" />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'User'}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <IconComponent size={20} />
                {item.label}
              </Link>
            );
          })}
          <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <User size={20} /> Profile
          </Link>
          <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto' }}>
            <LogOut size={20} />
            Logout
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {/* Top bar with search and notification bell */}
        <div className="top-bar">
          <form className="top-bar-search" onSubmit={handleSearch}>
            <Search size={18} className="top-bar-search-icon" />
            <input type="text" placeholder="Search videos, projects, clips..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="top-bar-search-input" />
          </form>
          <div className="top-bar-actions">
            <NotificationBell />
          </div>
        </div>

        {/* Email verification banner */}
        {user && user.email_verified === false && (
          <div className="email-verification-banner">
            <span>Please verify your email address to unlock all features.</span>
            <Link to="/profile" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Verify Now</Link>
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

export default Layout;

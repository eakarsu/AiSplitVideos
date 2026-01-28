import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Video, FolderOpen, Scissors, Film, Layout as LayoutIcon, Brain, Download,
  Home, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  Home,
  FolderOpen,
  Video,
  Scissors,
  Film,
  LayoutIcon,
  Brain,
  Download
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
];

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Video size={32} />
          <h1>AI Split Videos</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <IconComponent size={20} />
                {item.label}
              </Link>
            );
          })}
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

export default Layout;

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Video, FolderOpen, Film, Layout as LayoutIcon } from 'lucide-react';
import { API_URL } from '../utils/api';
import { LoadingSpinner } from '../components/common';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (query) fetchResults();
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.results || {});
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const sections = [
    { key: 'videos', label: 'Videos', icon: Video, path: '/videos' },
    { key: 'projects', label: 'Projects', icon: FolderOpen, path: '/projects' },
    { key: 'clips', label: 'Clips', icon: Film, path: '/clips' },
    { key: 'templates', label: 'Templates', icon: LayoutIcon, path: '/templates' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Search Results for "{query}" ({total})</h1>
      </div>
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <Search size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3>No results found</h3>
          <p>Try a different search term</p>
        </div>
      )}
      {sections.map(section => {
        const items = results[section.key] || [];
        if (items.length === 0) return null;
        const Icon = section.icon;
        return (
          <div key={section.key} style={{ marginBottom: 32 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon size={20} /> {section.label} ({items.length})
            </h2>
            <div className="cards-grid">
              {items.map(item => (
                <div key={item.id} className="card" onClick={() => navigate(section.path)} style={{ cursor: 'pointer' }}>
                  {item.thumbnail_url && (
                    <div className="card-image-container">
                      <img src={item.thumbnail_url} alt={item.title || item.name} className="card-image" />
                    </div>
                  )}
                  <div className="card-content">
                    <h3 className="card-title">{item.title || item.name}</h3>
                    <p className="card-description">{item.description || 'No description'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SearchResultsPage;

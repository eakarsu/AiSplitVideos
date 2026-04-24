import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/api';

const SearchBar = ({ onSearch, placeholder = 'Search...' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await axios.get(`${API_URL}/search/suggestions?q=${encodeURIComponent(q)}`);
      setSuggestions(res.data.suggestions || []);
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) onSearch?.(query.trim());
  };

  const handleSuggestionClick = (text) => {
    setQuery(text);
    setShowSuggestions(false);
    onSearch?.(text);
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <Search size={18} className="search-bar-icon" />
        <input type="text" value={query} onChange={handleChange} placeholder={placeholder}
          className="search-bar-input" onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
        {query && <button type="button" className="search-bar-clear" onClick={() => { setQuery(''); setSuggestions([]); onSearch?.(''); }}>
          <X size={16} /></button>}
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((s, i) => (
            <div key={i} className="search-suggestion-item" onClick={() => handleSuggestionClick(s.text)}>
              <Search size={14} /> <span>{s.text}</span> <span className="search-suggestion-type">{s.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

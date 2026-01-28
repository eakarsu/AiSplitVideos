import React from 'react';
import { Clock, Play } from 'lucide-react';
import FeaturePage from './FeaturePage';

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

export default ClipsPage;

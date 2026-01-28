import React from 'react';
import FeaturePage from './FeaturePage';
import { StatusIcon } from '../components/common';
import { formatFileSize } from '../utils/formatters';

const ExportsPage = () => (
  <FeaturePage title="Exports" endpoint="exports" type="export"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content">
          <div className="card-header-row"><h3 className="card-title">{item.name}</h3><StatusIcon status={item.status} /></div>
          <p className="card-description">{item.format.toUpperCase()} - {item.resolution}</p>
          {item.status !== 'completed' ? (
            <div className="card-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div><span>{item.progress}%</span></div>
          ) : (
            <p className="card-description">{formatFileSize(item.file_size)}</p>
          )}
          <div className="card-meta"><span className={`card-badge badge-${item.status}`}>{item.status}</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Export Name', type: 'text' },
      { name: 'format', label: 'Format', type: 'select', options: ['mp4', 'webm', 'gif', 'mp3'] },
      { name: 'resolution', label: 'Resolution', type: 'select', options: ['1920x1080', '1080x1920', '1280x720', '1080x1080'] }
    ]}
  />
);

export default ExportsPage;

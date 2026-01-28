import React from 'react';
import FeaturePage from './FeaturePage';
import { StatusIcon } from '../components/common';

const SplitJobsPage = () => (
  <FeaturePage title="Split Jobs" endpoint="split-jobs" type="split-job"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content">
          <div className="card-header-row"><h3 className="card-title">{item.name}</h3><StatusIcon status={item.status} /></div>
          <p className="card-description">Video: {item.video_title || '-'}</p>
          <div className="card-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div><span>{item.progress}%</span></div>
          <div className="card-meta"><span className="tag">{item.split_type}</span><span>{item.clips_generated} clips</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Job Name', type: 'text' },
      { name: 'split_type', label: 'Split Type', type: 'select', options: ['scene', 'time', 'ai_highlight', 'silence', 'manual'] }
    ]}
  />
);

export default SplitJobsPage;

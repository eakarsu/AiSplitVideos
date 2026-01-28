import React from 'react';

const ProgressBar = ({ progress, height = 8, showLabel = true }) => (
  <div className="detail-progress">
    <div className="progress-bar" style={{ height }}>
      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
    </div>
    {showLabel && <span>{progress}%</span>}
  </div>
);

export default ProgressBar;

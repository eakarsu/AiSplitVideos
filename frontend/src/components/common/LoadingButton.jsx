import React from 'react';

const LoadingButton = ({ loading, children, className = 'btn btn-primary', ...props }) => {
  return (
    <button className={`${className} ${loading ? 'loading-btn' : ''}`} disabled={loading} {...props}>
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};

export default LoadingButton;

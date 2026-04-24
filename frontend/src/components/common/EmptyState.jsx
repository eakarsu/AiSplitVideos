import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      {Icon && <Icon size={64} className="empty-state-icon" />}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={18} /> {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

import React from 'react';
import { Trash2, X } from 'lucide-react';

const BulkActionBar = ({ selectedCount, onDelete, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar">
      <span className="bulk-count">{selectedCount} selected</span>
      <button className="btn btn-danger" onClick={onDelete}><Trash2 size={16} /> Delete Selected</button>
      <button className="btn btn-secondary" onClick={onClear}><X size={16} /> Clear</button>
    </div>
  );
};

export default BulkActionBar;

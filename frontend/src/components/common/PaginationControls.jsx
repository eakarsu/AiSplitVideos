import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="pagination-controls">
      <div className="pagination-info">
        Showing {start}-{end} of {total}
      </div>
      <div className="pagination-actions">
        <select className="form-input pagination-size" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} / page</option>)}
        </select>
        <button className="btn btn-secondary pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="pagination-page">{page} / {totalPages}</span>
        <button className="btn btn-secondary pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;

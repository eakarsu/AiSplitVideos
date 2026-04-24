import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

const FilterPanel = ({ filters, activeFilters, onFilterChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = Object.values(activeFilters || {}).filter(v => v).length;

  return (
    <div className="filter-panel">
      <button className="btn btn-secondary filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        <Filter size={16} /> Filters {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="filter-panel-content">
          {filters.map(filter => (
            <div key={filter.name} className="filter-group">
              <label className="filter-label">{filter.label}</label>
              <select className="form-input filter-select" value={activeFilters?.[filter.name] || ''}
                onChange={(e) => onFilterChange(filter.name, e.target.value)}>
                <option value="">All</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
          {activeCount > 0 && (
            <button className="btn btn-secondary filter-clear" onClick={onClear}>
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;

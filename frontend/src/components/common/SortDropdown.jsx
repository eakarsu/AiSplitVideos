import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const SortDropdown = ({ options, sortBy, sortOrder, onSortChange }) => {
  const handleFieldChange = (e) => {
    onSortChange(e.target.value, sortOrder);
  };

  const toggleOrder = () => {
    onSortChange(sortBy, sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  return (
    <div className="sort-dropdown">
      <select className="form-input sort-select" value={sortBy} onChange={handleFieldChange}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button className="btn btn-secondary sort-order-btn" onClick={toggleOrder} title={sortOrder === 'ASC' ? 'Ascending' : 'Descending'}>
        {sortOrder === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      </button>
    </div>
  );
};

export default SortDropdown;

import React from 'react';
import { Layout as LayoutIcon, BarChart3 } from 'lucide-react';
import FeaturePage from './FeaturePage';

const TemplatesPage = () => (
  <FeaturePage title="Templates" endpoint="templates" type="template"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content template-card-content">
          <div className="template-icon"><LayoutIcon size={32} /></div>
          <h3 className="card-title">{item.name}</h3>
          <p className="card-description">{item.description}</p>
          <div className="card-meta"><span className="tag">{item.category}</span><span><BarChart3 size={14} /> {item.usage_count} uses</span></div>
        </div>
      </div>
    )}
    fields={[
      { name: 'name', label: 'Template Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['social', 'podcast', 'education', 'gaming', 'music', 'general'] },
      { name: 'split_type', label: 'Split Type', type: 'select', options: ['scene', 'time', 'ai_highlight', 'silence', 'manual'] }
    ]}
  />
);

export default TemplatesPage;

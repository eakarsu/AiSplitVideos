import React from 'react';
import { Shield, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import FeaturePage from './FeaturePage';

const RolesPage = () => {
  return (
    <FeaturePage
      title="Roles"
      endpoint="roles"
      type="role"
      fields={[
        { name: 'name', label: 'Role Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      cardRender={(item, onClick) => (
        <div key={item.id} className="card" onClick={onClick}>
          <div className="card-content template-card-content">
            <div className="template-icon"><Shield size={28} /></div>
            <h3 className="card-title">{item.name}</h3>
            <p className="card-description">{item.description || 'No description'}</p>
            <div className="card-meta">
              <span><Users size={14} /> {item.user_count || 0} users</span>
              <span className="tag">{(item.permissions || []).length} permissions</span>
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default RolesPage;

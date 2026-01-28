import React, { useState } from 'react';
import { X } from 'lucide-react';

const CreateModal = ({ isOpen, onClose, title, fields, onSubmit }) => {
  const [values, setValues] = useState({});

  const handleChange = (name, value) => {
    setValues({ ...values, [name]: value });
  };

  const handleSubmit = () => {
    onSubmit(values);
    setValues({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body">
          {fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea className="form-input" value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)} rows={3} />
              ) : field.type === 'select' ? (
                <select className="form-input" value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}>
                  <option value="">Select...</option>
                  {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type={field.type} className="form-input" value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} />
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LoadingButton } from '../common';

const CreateModal = ({ isOpen, onClose, title, fields, onSubmit, initialValues }) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        const initial = {};
        fields.forEach(f => { initial[f.name] = initialValues[f.name] || ''; });
        setValues(initial);
      } else {
        setValues({});
      }
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const handleChange = (name, value) => {
    setValues({ ...values, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach(f => {
      if (f.required !== false && !values[f.name] && f.type !== 'number') {
        newErrors[f.name] = `${f.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
      setValues({});
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
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
                <textarea className={`form-input ${errors[field.name] ? 'form-input-error' : ''}`}
                  value={values[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} rows={3} />
              ) : field.type === 'select' ? (
                <select className={`form-input ${errors[field.name] ? 'form-input-error' : ''}`}
                  value={values[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)}>
                  <option value="">Select...</option>
                  {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type={field.type} className={`form-input ${errors[field.name] ? 'form-input-error' : ''}`}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} />
              )}
              {errors[field.name] && <span className="form-error">{errors[field.name]}</span>}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <LoadingButton loading={submitting} onClick={handleSubmit}>
            {initialValues ? 'Save Changes' : 'Create'}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;

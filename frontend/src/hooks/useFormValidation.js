import { useState, useCallback } from 'react';

const useFormValidation = (validationRules) => {
  const [errors, setErrors] = useState({});

  const validate = useCallback((values) => {
    const newErrors = {};
    for (const [field, rules] of Object.entries(validationRules)) {
      for (const rule of rules) {
        const error = rule(values[field], field);
        if (error) {
          newErrors[field] = error;
          break;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationRules]);

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, clearErrors };
};

export default useFormValidation;

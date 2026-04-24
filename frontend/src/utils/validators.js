export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) return `${fieldName} is required`;
  return '';
};

export const validateMinLength = (value, min, fieldName) => {
  if (value && value.length < min) return `${fieldName} must be at least ${min} characters`;
  return '';
};

export const validateMaxLength = (value, max, fieldName) => {
  if (value && value.length > max) return `${fieldName} must be at most ${max} characters`;
  return '';
};

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export const validatePassword = (v) => {
  if (!v || v.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Password must contain letters and numbers';
  return '';
};

export const required = (v, label) => (String(v ?? '').trim() ? '' : `${label} is required`);

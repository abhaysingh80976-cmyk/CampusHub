const ApiError = require('../utils/ApiError');

/*
 schema example: { title: { type: 'string', required: true, max: 100 } }
 types: string | email | number | url | fileref | photo | object | array
 Sirf schema me defined fields aage jaate hain (mass-assignment se protection).
*/
const validate = (schema) => (req, res, next) => {
  const errors = [];
  const clean = {};
  const body = req.body || {};

  for (const [key, rule] of Object.entries(schema)) {
    let value = body[key];
    if (value === undefined || value === null || value === '') {
      if (rule.required) errors.push(`${key} is required`);
      continue;
    }
    switch (rule.type) {
      case 'number':
        value = Number(value);
        if (Number.isNaN(value)) { errors.push(`${key} must be a number`); continue; }
        if (rule.min !== undefined && value < rule.min) errors.push(`${key} must be at least ${rule.min}`);
        if (rule.max !== undefined && value > rule.max) errors.push(`${key} must be at most ${rule.max}`);
        break;
      case 'email':
        value = String(value).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { errors.push(`${key} must be a valid email`); continue; }
        break;
      case 'url':
        value = String(value).trim();
        if (!/^https?:\/\//.test(value)) { errors.push(`${key} must be a valid URL`); continue; }
        break;
      case 'fileref': // Firestore auto-ID (20 characters) of an uploaded file
        value = String(value).trim();
        if (!/^[A-Za-z0-9]{20}$/.test(value)) { errors.push(`${key} must be an uploaded file`); continue; }
        break;
      case 'photo': // chhoti compressed profile photo (data URL)
        value = String(value);
        if (value.length > 150000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
          errors.push(`${key} must be a small JPG, PNG or WEBP image`);
          continue;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) { errors.push(`${key} must be an object`); continue; }
        break;
      case 'array':
        if (!Array.isArray(value)) { errors.push(`${key} must be an array`); continue; }
        break;
      default:
        if (typeof value !== 'string') { errors.push(`${key} must be text`); continue; }
        value = value.trim();
        if (rule.min && value.length < rule.min) errors.push(`${key} must be at least ${rule.min} characters`);
        if (rule.max && value.length > rule.max) errors.push(`${key} must be at most ${rule.max} characters`);
    }
    if (rule.enum && !rule.enum.includes(value)) errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
    clean[key] = value;
  }

  if (errors.length) return next(new ApiError(400, 'Validation failed', errors));
  req.body = clean;
  next();
};

module.exports = validate;
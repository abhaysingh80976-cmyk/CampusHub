import api from './api';

const MAX_BYTES = 700 * 1024; // backend ki limit se match karta hai

export const FILE_RULES = {
  pdf: { types: ['application/pdf'], accept: 'application/pdf', label: 'PDF (max 700 KB)' },
  image: {
    types: ['image/jpeg', 'image/png', 'image/webp'],
    accept: 'image/jpeg,image/png,image/webp',
    label: 'JPG, PNG or WEBP (max 700 KB)',
  },
  pdfOrImage: {
    types: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
    label: 'PDF or image (max 700 KB)',
  },
};

export const validateFile = (file, kind = 'pdf') => {
  const rule = FILE_RULES[kind];
  if (!file) return 'Please select a file';
  if (!rule.types.includes(file.type)) return `Invalid file type. Allowed: ${rule.label}`;
  if (file.size > MAX_BYTES) return 'File too large. Maximum size is 700 KB (compress the PDF and try again)';
  return null;
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });

/*
 purpose: 'assignment' | 'submission' | 'material'
 Return: { id, name }  -> pages ye id backend ko filePath / attachmentPath me bhejte hain
*/
export const uploadFile = async (purpose, file, onProgress) => {
  const data = await toBase64(file);
  const res = await api.post(
    '/files',
    { name: file.name, contentType: file.type, kind: purpose, data },
    {
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }
  );
  return { id: res.data.id, name: res.data.name };
};

// Login token ke saath file laata hai aur browser me download kara deta hai
export const downloadFile = async (fileId, fileName = 'file') => {
  const res = await api.get(`/files/${fileId}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Profile photo: 256x256 JPEG me compress karke data URL banata hai (~20-40 KB)
export const compressImage = (file, size = 256) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(img.width, img.height); // center square crop
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the image'));
    };
    img.src = objectUrl;
  });

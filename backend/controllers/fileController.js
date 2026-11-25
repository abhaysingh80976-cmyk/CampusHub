const { admin, db } = require('../config/firebase');
const { list, now } = require('../services/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const MAX_BYTES = 700 * 1024; // Firestore document 1 MB se chhota rahe, isliye 700 KB

// Kaun kis type ki file upload kar sakta hai
const KIND_ROLES = {
  submission: ['student'],
  assignment: ['teacher', 'admin'],
  material: ['teacher', 'admin'],
};
const KIND_TYPES = {
  submission: ['application/pdf'],
  material: ['application/pdf'],
  assignment: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
};

// File ke andar ke asli bytes check karte hain (sirf extension ya naam par bharosa nahi)
const hasValidSignature = (buf, type) => {
  if (type === 'application/pdf') return buf.slice(0, 4).toString() === '%PDF';
  if (type === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf.slice(1, 4).toString() === 'PNG';
  if (type === 'image/webp') return buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return false;
};

exports.uploadFile = asyncHandler(async (req, res) => {
  const { name, contentType, kind, data } = req.body;
  const { role, status, uid } = req.user;

  if (!KIND_ROLES[kind].includes(role)) throw new ApiError(403, 'You cannot upload this type of file');
  if (role === 'teacher' && status !== 'active') throw new ApiError(403, 'Your teacher account is awaiting admin approval');
  if (!KIND_TYPES[kind].includes(contentType)) throw new ApiError(400, 'File type not allowed');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new ApiError(400, 'Invalid file data');

  const buffer = Buffer.from(data, 'base64');
  if (buffer.length > MAX_BYTES) throw new ApiError(400, 'File too large. Maximum size is 700 KB');
  if (!hasValidSignature(buffer, contentType)) throw new ApiError(400, 'File content does not match its type');

  const doc = {
    name: name.replace(/[^\w.\- ()]/g, '_'),
    contentType,
    kind,
    size: buffer.length,
    ownerId: uid,
    ownerName: req.user.name,
    data,
    createdAt: now(),
  };
  const ref = await db.collection('files').add(doc);
  res.status(201).json({ id: ref.id, name: doc.name, size: doc.size, contentType });
});

exports.downloadFile = asyncHandler(async (req, res) => {
  const snap = await db.collection('files').doc(req.params.id).get();
  if (!snap.exists) throw new ApiError(404, 'File not found');
  const file = snap.data();
  const { uid, role } = req.user;

  // Submissions private hain: student khud, admin, ya us assignment ka teacher
  if (file.kind === 'submission' && file.ownerId !== uid && role !== 'admin') {
    const subs = await list('submissions', [['filePath', '==', req.params.id]]);
    if (!subs.some((sub) => sub.teacherId === uid)) throw new ApiError(403, 'You cannot access this file');
  }

  const buffer = Buffer.from(file.data, 'base64');
  res.set({
    'Content-Type': file.contentType,
    'Content-Length': buffer.length,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(buffer);
});

// Middleware: body me jo file ID hai wo isi user ki upload ki hui aur sahi kind ki honi chahiye
exports.requireOwnFile = (kind, pathField, urlField) =>
  asyncHandler(async (req, res, next) => {
    const id = req.body[pathField];
    if (!id) return next();
    // select() se sirf 2 chhote fields aate hain, poori file nahi
    const snap = await db.collection('files')
      .where(admin.firestore.FieldPath.documentId(), '==', id)
      .select('ownerId', 'kind')
      .get();
    const f = snap.docs[0]?.data();
    if (!f || f.ownerId !== req.user.uid || f.kind !== kind) throw new ApiError(400, 'Invalid file reference');
    if (urlField) req.body[urlField] = id; // purani field fileUrl/attachmentUrl bhi set rahe
    next();
  });
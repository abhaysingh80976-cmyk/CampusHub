const { db, bucket } = require('../config/firebase');
const { list, getOne, sortDesc, search, paginate, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

exports.listMaterials = async (req, res) => {
  const { subjectId, semester, q, page, limit } = req.query;
  let items = await list('studyMaterials', [
    ['subjectId', '==', subjectId],
    ['semester', '==', semester ? Number(semester) : undefined],
  ]);
  if (req.user.role === 'teacher' && req.query.mine === 'true') items = items.filter((m) => m.uploadedBy === req.user.uid);
  items = search(items, q, ['title', 'description', 'subjectName']);
  res.json(paginate(sortDesc(items), page, limit || 12));
};

exports.createMaterial = async (req, res) => {
  const { subjectId, title, description, filePath } = req.body;
  const subject = await getOne('subjects', subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');
  if (req.user.role === 'teacher' && subject.teacherId !== req.user.uid) {
    throw new ApiError(403, 'You can only upload materials for your assigned subjects');
  }
  const data = {
    subjectId,
    title,
    description: description || '',
    filePath,
    subjectName: subject.name,
    semester: subject.semester,
    uploadedBy: req.user.uid,
    uploaderName: req.user.name,
    createdAt: now(),
  };
  const ref = await db.collection('studyMaterials').add(data);
  res.status(201).json({ id: ref.id, ...data });
};

exports.deleteMaterial = async (req, res) => {
  const item = await getOne('studyMaterials', req.params.id);
  if (!item) throw new ApiError(404, 'Material not found');
  if (req.user.role !== 'admin' && item.uploadedBy !== req.user.uid) {
    throw new ApiError(403, 'You can only delete your own uploads');
  }
  try { await bucket.file(item.filePath).delete(); } catch (e) { /* ignore */ }
  await db.collection('studyMaterials').doc(req.params.id).delete();
  res.json({ message: 'Material deleted' });
};
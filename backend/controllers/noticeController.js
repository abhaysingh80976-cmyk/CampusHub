const { db } = require('../config/firebase');
const { list, getOne, sortDesc, paginate, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

exports.listNotices = async (req, res) => {
  const { category, page, limit } = req.query;
  const items = await list('notices', [['category', '==', category]]);
  res.json(paginate(sortDesc(items), page, limit || 10));
};

exports.createNotice = async (req, res) => {
  const data = { ...req.body, createdBy: req.user.uid, createdByName: req.user.name, createdByRole: req.user.role, createdAt: now() };
  const ref = await db.collection('notices').add(data);
  res.status(201).json({ id: ref.id, ...data });
};

const assertCanEdit = (user, notice) => {
  if (user.role !== 'admin' && notice.createdBy !== user.uid) throw new ApiError(403, 'You can only modify your own notices');
};

exports.updateNotice = async (req, res) => {
  const existing = await getOne('notices', req.params.id);
  if (!existing) throw new ApiError(404, 'Notice not found');
  assertCanEdit(req.user, existing);
  const updates = { ...req.body, updatedAt: now() };
  await db.collection('notices').doc(req.params.id).update(updates);
  res.json({ ...existing, ...updates });
};

exports.deleteNotice = async (req, res) => {
  const existing = await getOne('notices', req.params.id);
  if (!existing) throw new ApiError(404, 'Notice not found');
  assertCanEdit(req.user, existing);
  await db.collection('notices').doc(req.params.id).delete();
  res.json({ message: 'Notice deleted' });
};
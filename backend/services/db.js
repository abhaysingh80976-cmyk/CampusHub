const { db } = require('../config/firebase');

const now = () => new Date().toISOString();

const list = async (collection, filters = []) => {
  let q = db.collection(collection);
  filters.forEach(([field, op, value]) => {
    if (value !== undefined && value !== null && value !== '') q = q.where(field, op, value);
  });
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const getOne = async (collection, id) => {
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

const sortDesc = (arr, field = 'createdAt') =>
  arr.sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || '')));

const search = (arr, q, fields) => {
  if (!q) return arr;
  const term = String(q).toLowerCase();
  return arr.filter((item) => fields.some((f) => String(item[f] || '').toLowerCase().includes(term)));
};

const paginate = (arr, page = 1, limit = 10) => {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const total = arr.length;
  return { data: arr.slice((p - 1) * l, p * l), total, page: p, pages: Math.max(Math.ceil(total / l), 1) };
};

const countWhere = async (collection, field, value) => {
  let q = db.collection(collection);
  if (field) q = q.where(field, '==', value);
  const snap = await q.count().get();
  return snap.data().count;
};

module.exports = { now, list, getOne, sortDesc, search, paginate, countWhere };
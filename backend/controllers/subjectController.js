const { db } = require('../config/firebase');
const { list, getOne, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

exports.listSubjects = async (req, res) => {
  const { role, uid, semester, department } = req.user;
  let subjects;
  if (role === 'teacher') subjects = await list('subjects', [['teacherId', '==', uid]]);
  else if (role === 'student') {
    subjects = await list('subjects', [['semester', '==', semester], ['department', '==', department]]);
  } else {
    subjects = await list('subjects', [['semester', '==', req.query.semester ? Number(req.query.semester) : undefined]]);
  }
  res.json(subjects.sort((a, b) => a.name.localeCompare(b.name)));
};

const resolveTeacher = async (teacherId) => {
  const teacher = await getOne('users', teacherId);
  if (!teacher || teacher.role !== 'teacher') throw new ApiError(400, 'Selected teacher does not exist');
  return teacher;
};

exports.createSubject = async (req, res) => {
  const teacher = await resolveTeacher(req.body.teacherId);
  const data = { ...req.body, teacherName: teacher.name, createdAt: now() };
  const ref = await db.collection('subjects').add(data);
  res.status(201).json({ id: ref.id, ...data });
};

exports.updateSubject = async (req, res) => {
  const existing = await getOne('subjects', req.params.id);
  if (!existing) throw new ApiError(404, 'Subject not found');
  const teacher = await resolveTeacher(req.body.teacherId || existing.teacherId);
  const updates = { ...req.body, teacherName: teacher.name, updatedAt: now() };
  await db.collection('subjects').doc(req.params.id).update(updates);
  res.json({ ...existing, ...updates });
};

exports.deleteSubject = async (req, res) => {
  const existing = await getOne('subjects', req.params.id);
  if (!existing) throw new ApiError(404, 'Subject not found');
  await db.collection('subjects').doc(req.params.id).delete();
  res.json({ message: 'Subject deleted' });
};
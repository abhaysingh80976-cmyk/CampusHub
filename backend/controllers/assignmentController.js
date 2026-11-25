const { db, bucket } = require('../config/firebase');
const { list, getOne, sortDesc, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

const assertOwner = (user, doc) => {
  if (user.role !== 'admin' && doc.teacherId !== user.uid) throw new ApiError(403, 'You can only manage your own assignments');
};

// File Firestore ke "files" collection me hai; bucket wrapper usse delete kar deta hai
const deleteFile = async (id) => {
  if (!id) return;
  try { await bucket.file(id).delete(); } catch (e) { /* file pehle hi delete ho chuki ho sakti hai */ }
};

exports.listAssignments = async (req, res) => {
  const { role, uid, semester, department } = req.user;
  let items;
  if (role === 'teacher') items = await list('assignments', [['teacherId', '==', uid]]);
  else if (role === 'student') {
    items = await list('assignments', [['semester', '==', semester]]);
    items = items.filter((a) => a.department === department);
  } else items = await list('assignments');
  res.json(sortDesc(items));
};

exports.createAssignment = async (req, res) => {
  const { subjectId, title, description, dueDate, attachmentPath } = req.body;
  const subject = await getOne('subjects', subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');
  if (req.user.role === 'teacher' && subject.teacherId !== req.user.uid) {
    throw new ApiError(403, 'You can only create assignments for your assigned subjects');
  }
  const data = {
    subjectId,
    title,
    description,
    dueDate,
    attachmentPath: attachmentPath || '',
    subjectName: subject.name,
    semester: subject.semester,
    department: subject.department,
    teacherId: subject.teacherId,
    teacherName: subject.teacherName,
    createdAt: now(),
  };
  const ref = await db.collection('assignments').add(data);
  res.status(201).json({ id: ref.id, ...data });
};

exports.updateAssignment = async (req, res) => {
  const existing = await getOne('assignments', req.params.id);
  if (!existing) throw new ApiError(404, 'Assignment not found');
  assertOwner(req.user, existing);
  const { title, description, dueDate, attachmentPath } = req.body; // subject change allowed nahi
  const updates = { title, description, dueDate, updatedAt: now() };
  if (attachmentPath && attachmentPath !== existing.attachmentPath) {
    await deleteFile(existing.attachmentPath); // purani attachment hatao
    updates.attachmentPath = attachmentPath;
  }
  await db.collection('assignments').doc(req.params.id).update(updates);
  res.json({ ...existing, ...updates });
};

exports.deleteAssignment = async (req, res) => {
  const existing = await getOne('assignments', req.params.id);
  if (!existing) throw new ApiError(404, 'Assignment not found');
  assertOwner(req.user, existing);
  const subs = await list('submissions', [['assignmentId', '==', req.params.id]]);
  await Promise.all(subs.map(async (s) => {
    await deleteFile(s.filePath);
    await db.collection('submissions').doc(s.id).delete();
  }));
  await deleteFile(existing.attachmentPath);
  await db.collection('assignments').doc(req.params.id).delete();
  res.json({ message: 'Assignment deleted' });
};

// ---------- Submissions ----------
exports.submitAssignment = async (req, res) => {
  const { assignmentId, filePath, fileName } = req.body;
  const assignment = await getOne('assignments', assignmentId);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  if (assignment.semester !== req.user.semester || assignment.department !== req.user.department) {
    throw new ApiError(403, 'This assignment is not assigned to you');
  }
  const id = `${assignmentId}_${req.user.uid}`;
  const old = await getOne('submissions', id);
  if (old && old.filePath !== filePath) await deleteFile(old.filePath); // re-submit par purani file hatao

  const late = new Date() > new Date(assignment.dueDate);
  const data = {
    assignmentId,
    assignmentTitle: assignment.title,
    subjectName: assignment.subjectName,
    teacherId: assignment.teacherId,
    studentId: req.user.uid,
    studentName: req.user.name,
    studentRoll: req.user.studentId || '',
    filePath,
    fileName,
    status: late ? 'late' : 'submitted',
    remarks: '',
    submittedAt: now(),
  };
  await db.collection('submissions').doc(id).set(data);
  res.status(201).json({ id, ...data });
};

exports.mySubmissions = async (req, res) => {
  res.json(sortDesc(await list('submissions', [['studentId', '==', req.user.uid]]), 'submittedAt'));
};

exports.assignmentSubmissions = async (req, res) => {
  const assignment = await getOne('assignments', req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  assertOwner(req.user, assignment);
  res.json(sortDesc(await list('submissions', [['assignmentId', '==', req.params.id]]), 'submittedAt'));
};

exports.recentSubmissions = async (req, res) => {
  const items = req.user.role === 'admin'
    ? await list('submissions')
    : await list('submissions', [['teacherId', '==', req.user.uid]]);
  res.json(sortDesc(items, 'submittedAt').slice(0, 8));
};

exports.updateSubmissionStatus = async (req, res) => {
  const sub = await getOne('submissions', req.params.id);
  if (!sub) throw new ApiError(404, 'Submission not found');
  if (req.user.role !== 'admin' && sub.teacherId !== req.user.uid) throw new ApiError(403, 'Not allowed');
  const updates = { status: req.body.status, remarks: req.body.remarks || '', reviewedAt: now() };
  await db.collection('submissions').doc(req.params.id).update(updates);
  res.json({ ...sub, ...updates });
};
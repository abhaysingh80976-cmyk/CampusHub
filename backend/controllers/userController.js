const { db, auth } = require('../config/firebase');
const { list, getOne, sortDesc, search, paginate, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

exports.listUsers = async (req, res) => {
  const { role, status, q, page, limit } = req.query;
  let users = await list('users', [['role', '==', role], ['status', '==', status]]);
  users = search(users, q, ['name', 'email', 'studentId', 'department']);
  res.json(paginate(sortDesc(users), page, limit));
};

// Teacher/Admin: students. Teacher sirf unhi semester+department ke students dekhta hai jo uske subjects me aate hain
exports.listStudents = async (req, res) => {
  const { semester, department, q, page, limit } = req.query;
  let students = await list('users', [['role', '==', 'student']]);

  if (req.user.role === 'teacher') {
    const subjects = await list('subjects', [['teacherId', '==', req.user.uid]]);
    const allowed = new Set(subjects.map((s) => `${s.semester}|${s.department}`));
    students = students.filter((s) => allowed.has(`${s.semester}|${s.department}`));
  }
  if (semester) students = students.filter((s) => String(s.semester) === String(semester));
  if (department) students = students.filter((s) => s.department === department);
  students = search(students, q, ['name', 'email', 'studentId']);
  res.json(paginate(students.sort((a, b) => a.name.localeCompare(b.name)), page, limit || 20));
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, department, semester, studentId } = req.body;
  if (role === 'student' && (!studentId || !semester)) {
    throw new ApiError(400, 'Student ID and semester are required for students');
  }
  let authUser;
  try {
    authUser = await auth.createUser({ email, password, displayName: name });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
  const profile = {
    uid: authUser.uid,
    email,
    name,
    role,
    department,
    semester: role === 'student' ? semester : null,
    studentId: role === 'student' ? studentId : null,
    photoURL: '',
    status: 'active',
    createdAt: now(),
  };
  try {
    await db.collection('users').doc(authUser.uid).set(profile);
  } catch (err) {
    await auth.deleteUser(authUser.uid);
    throw err;
  }
  res.status(201).json(profile);
};

exports.updateUser = async (req, res) => {
  const { uid } = req.params;
  const target = await getOne('users', uid);
  if (!target) throw new ApiError(404, 'User not found');
  if (target.role === 'admin' && uid !== req.user.uid) throw new ApiError(403, 'Cannot modify another admin');
  if (uid === req.user.uid && req.body.status && req.body.status !== 'active') {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  const updates = { ...req.body, updatedAt: now() };
  await db.collection('users').doc(uid).update(updates);
  if (req.body.status) await auth.updateUser(uid, { disabled: req.body.status === 'inactive' });
  res.json({ ...target, ...updates });
};

exports.approveTeacher = async (req, res) => {
  const target = await getOne('users', req.params.uid);
  if (!target || target.role !== 'teacher') throw new ApiError(404, 'Teacher not found');
  await db.collection('users').doc(target.uid).update({ status: 'active', approvedAt: now() });
  await auth.updateUser(target.uid, { disabled: false });
  res.json({ ...target, status: 'active' });
};

exports.updateMe = async (req, res) => {
  const updates = { ...req.body, updatedAt: now() };
  await db.collection('users').doc(req.user.uid).update(updates);
  res.json({ ...req.user, ...updates });
};
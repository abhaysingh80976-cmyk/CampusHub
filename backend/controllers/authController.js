const { db } = require('../config/firebase');
const { now } = require('../services/db');
const ApiError = require('../utils/ApiError');

exports.register = async (req, res) => {
  const { uid, email } = req.firebaseUser;
  const ref = db.collection('users').doc(uid);
  if ((await ref.get()).exists) throw new ApiError(409, 'Profile already exists');

  const { name, role, department, semester, studentId } = req.body;
  if (role === 'student' && (!studentId || !semester)) {
    throw new ApiError(400, 'Student ID and semester are required for students');
  }

  const profile = {
    uid,
    email,
    name,
    role, // validate schema sirf student/teacher allow karta hai, admin nahi
    department,
    semester: role === 'student' ? semester : null,
    studentId: role === 'student' ? studentId : null,
    photoURL: '',
    status: role === 'teacher' ? 'pending' : 'active',
    createdAt: now(),
  };
  await ref.set(profile);
  res.status(201).json(profile);
};

exports.me = (req, res) => res.json(req.user);
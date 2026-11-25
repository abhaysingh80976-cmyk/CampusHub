const { db } = require('../config/firebase');
const { list, getOne, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

// Teacher (apne subject) ya admin attendance save/edit kar sakta hai. Student kabhi nahi.
exports.saveAttendance = async (req, res) => {
  const { subjectId, date, records } = req.body;
  const subject = await getOne('subjects', subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');
  if (req.user.role === 'teacher' && subject.teacherId !== req.user.uid) {
    throw new ApiError(403, 'You can only mark attendance for your assigned subjects');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'Date must be YYYY-MM-DD');

  const uids = Object.keys(records);
  if (!uids.length) throw new ApiError(400, 'Attendance records cannot be empty');
  if (!Object.values(records).every((v) => v === 'present' || v === 'absent')) {
    throw new ApiError(400, 'Each record must be present or absent');
  }

  const id = `${subjectId}_${date}`;
  const ref = db.collection('attendance').doc(id);
  const existing = await ref.get();
  const data = {
    subjectId,
    subjectName: subject.name,
    semester: subject.semester,
    department: subject.department,
    date,
    records,
    markedBy: existing.exists ? existing.data().markedBy : req.user.uid,
    updatedBy: req.user.uid,
    updatedAt: now(),
    createdAt: existing.exists ? existing.data().createdAt : now(),
  };
  await ref.set(data);
  res.status(existing.exists ? 200 : 201).json({ id, ...data });
};

// Teacher/Admin: attendance records (filter by subject, semester, date)
exports.listAttendance = async (req, res) => {
  const { subjectId, semester, date } = req.query;
  let records = await list('attendance', [
    ['subjectId', '==', subjectId],
    ['semester', '==', semester ? Number(semester) : undefined],
    ['date', '==', date],
  ]);
  if (req.user.role === 'teacher') {
    const subjects = await list('subjects', [['teacherId', '==', req.user.uid]]);
    const mine = new Set(subjects.map((s) => s.id));
    records = records.filter((r) => mine.has(r.subjectId));
  }
  res.json(records.sort((a, b) => b.date.localeCompare(a.date)));
};

// Student: apni subject-wise attendance
exports.myAttendance = async (req, res) => {
  const { uid, semester, department } = req.user;
  const records = await list('attendance', [['semester', '==', semester]]);
  const relevant = records.filter((r) => r.department === department && r.records[uid]);

  const bySubject = {};
  relevant.forEach((r) => {
    const s = (bySubject[r.subjectId] ||= {
      subjectId: r.subjectId, subjectName: r.subjectName, total: 0, present: 0, absent: 0, history: [],
    });
    s.total += 1;
    r.records[uid] === 'present' ? (s.present += 1) : (s.absent += 1);
    s.history.push({ date: r.date, status: r.records[uid] });
  });

  const summary = Object.values(bySubject).map((s) => ({
    ...s,
    percentage: s.total ? Math.round((s.present / s.total) * 100) : 0,
    history: s.history.sort((a, b) => b.date.localeCompare(a.date)),
  }));
  const total = summary.reduce((n, s) => n + s.total, 0);
  const present = summary.reduce((n, s) => n + s.present, 0);
  res.json({ subjects: summary, overall: total ? Math.round((present / total) * 100) : 0 });
};
// Usage: node scripts/seedDemo.js "DemoPassword123"
// Demo teacher + student + subjects + attendance + assignment + notices + events banata hai.
require('dotenv').config();
const { auth, db } = require('../config/firebase');

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: node scripts/seedDemo.js <demo password (min 8 chars)>');
  process.exit(1);
}

const iso = (days) => new Date(Date.now() + days * 86400000).toISOString();
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

const ensureUser = async ({ email, name, role, status, department, semester, studentId }) => {
  let user;
  try { user = await auth.getUserByEmail(email); }
  catch { user = await auth.createUser({ email, password, displayName: name }); }
  await db.collection('users').doc(user.uid).set({
    uid: user.uid, email, name, role, status, department, semester: semester || null,
    studentId: studentId || null, photoURL: '', createdAt: new Date().toISOString(),
  });
  return user.uid;
};

(async () => {
  const teacherId = await ensureUser({
    email: 'teacher.demo@campushub.test', name: 'Prof. Anita Verma', role: 'teacher',
    status: 'active', department: 'CSE (AI & ML)',
  });
  const studentId = await ensureUser({
    email: 'student.demo@campushub.test', name: 'Rahul Sharma', role: 'student',
    status: 'active', department: 'CSE (AI & ML)', semester: 5, studentId: 'CSE2201',
  });
  await ensureUser({
    email: 'pending.teacher@campushub.test', name: 'Dr. Suresh Gupta', role: 'teacher',
    status: 'pending', department: 'CSE (AI & ML)',
  });

  const subjectDefs = [
    { name: 'Machine Learning', code: 'AML501' },
    { name: 'Web Technologies', code: 'CSE502' },
    { name: 'Database Management', code: 'CSE503' },
  ];
  const subjects = [];
  for (const sub of subjectDefs) {
    const ref = await db.collection('subjects').add({
      ...sub, department: 'CSE (AI & ML)', semester: 5, teacherId, teacherName: 'Prof. Anita Verma',
      createdAt: new Date().toISOString(),
    });
    subjects.push({ id: ref.id, ...sub });
  }

  // 10 din ki sample attendance
  for (let i = 1; i <= 10; i++) {
    for (const sub of subjects) {
      const date = day(-i);
      await db.collection('attendance').doc(`${sub.id}_${date}`).set({
        subjectId: sub.id, subjectName: sub.name, semester: 5, department: 'CSE (AI & ML)', date,
        records: { [studentId]: i % 4 === 0 ? 'absent' : 'present' },
        markedBy: teacherId, updatedBy: teacherId, createdAt: iso(-i), updatedAt: iso(-i),
      });
    }
  }

  await db.collection('assignments').add({
    subjectId: subjects[0].id, subjectName: 'Machine Learning', title: 'Linear Regression Implementation',
    description: 'Implement linear regression from scratch and submit a PDF report with your results.',
    dueDate: iso(7), semester: 5, department: 'CSE (AI & ML)', teacherId, teacherName: 'Prof. Anita Verma',
    attachmentPath: '', createdAt: iso(-1),
  });

  const notices = [
    { title: 'Mid-Semester Exam Schedule Released', category: 'exam', content: 'Mid-semester exams begin next Monday. Check the department board for the timetable.' },
    { title: 'Diwali Holiday Notice', category: 'holiday', content: 'College will remain closed for Diwali break as per academic calendar.' },
    { title: 'Library Timings Updated', category: 'general', content: 'Library will remain open until 8 PM on weekdays during exam season.' },
  ];
  for (const n of notices) {
    await db.collection('notices').add({ ...n, createdBy: teacherId, createdByName: 'Prof. Anita Verma', createdByRole: 'teacher', createdAt: iso(-2) });
  }

  const events = [
    { title: 'TechFest 2026', description: 'Annual technical festival with hackathon, robotics and coding contests.', venue: 'Main Auditorium', date: iso(14) },
    { title: 'Career Guidance Workshop', description: 'Industry experts share placement and internship tips.', venue: 'Seminar Hall B', date: iso(5) },
  ];
  for (const e of events) await db.collection('events').add({ ...e, createdBy: teacherId, createdAt: iso(-3) });

  console.log('Demo data ready.');
  console.log('Teacher: teacher.demo@campushub.test | Student: student.demo@campushub.test | Pending teacher: pending.teacher@campushub.test');
  console.log('Password = jo tumne command me diya.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
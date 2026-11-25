const { list, countWhere, sortDesc } = require('../services/db');

exports.overview = async (req, res) => {
  const { role, uid } = req.user;

  if (role === 'admin') {
    const [students, teachers, pendingTeachers, assignments, materials, events, notices, subjects] = await Promise.all([
      countWhere('users', 'role', 'student'),
      countWhere('users', 'role', 'teacher'),
      countWhere('users', 'status', 'pending'),
      countWhere('assignments'),
      countWhere('studyMaterials'),
      countWhere('events'),
      countWhere('notices'),
      countWhere('subjects'),
    ]);
    const [recentUsers, recentNotices, recentSubs] = await Promise.all([
      list('users'), list('notices'), list('submissions'),
    ]);
    const activity = [
      ...sortDesc(recentUsers).slice(0, 5).map((u) => ({ type: 'user', text: `${u.name} joined as ${u.role}`, time: u.createdAt })),
      ...sortDesc(recentNotices).slice(0, 5).map((n) => ({ type: 'notice', text: `Notice: ${n.title}`, time: n.createdAt })),
      ...sortDesc(recentSubs, 'submittedAt').slice(0, 5).map((s) => ({ type: 'submission', text: `${s.studentName} submitted ${s.assignmentTitle}`, time: s.submittedAt })),
    ].sort((a, b) => String(b.time).localeCompare(String(a.time))).slice(0, 10);
    return res.json({ students, teachers, pendingTeachers, assignments, materials, events, notices, subjects, activity });
  }

  if (role === 'teacher') {
    const subjects = await list('subjects', [['teacherId', '==', uid]]);
    const keys = new Set(subjects.map((s) => `${s.semester}|${s.department}`));
    const students = (await list('users', [['role', '==', 'student']])).filter((s) => keys.has(`${s.semester}|${s.department}`));
    const assignments = await list('assignments', [['teacherId', '==', uid]]);
    const now = new Date();
    const active = assignments.filter((a) => new Date(a.dueDate) >= now).length;
    const submissions = await list('submissions', [['teacherId', '==', uid]]);
    return res.json({ students: students.length, subjects: subjects.length, activeAssignments: active, submissions: submissions.length });
  }

  // student
  const { semester, department } = req.user;
  const subjects = await list('subjects', [['semester', '==', semester], ['department', '==', department]]);
  const assignments = (await list('assignments', [['semester', '==', semester]])).filter((a) => a.department === department);
  const mySubs = await list('submissions', [['studentId', '==', uid]]);
  const done = new Set(mySubs.map((s) => s.assignmentId));
  const pending = assignments.filter((a) => !done.has(a.id)).length;
  const events = (await list('events')).filter((e) => new Date(e.date) >= new Date()).length;
  res.json({ subjects: subjects.length, pendingAssignments: pending, upcomingEvents: events });
};
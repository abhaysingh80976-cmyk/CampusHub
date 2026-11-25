const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { verifyToken, verifyTokenOnly, requireRole } = require('../middleware/auth');

const authC = require('../controllers/authController');
const userC = require('../controllers/userController');
const subjectC = require('../controllers/subjectController');
const attC = require('../controllers/attendanceController');
const asgC = require('../controllers/assignmentController');
const matC = require('../controllers/materialController');
const notC = require('../controllers/noticeController');
const evtC = require('../controllers/eventController');
const statC = require('../controllers/statsController');
const fileC = require('../controllers/fileController');

const h = asyncHandler;
const admin = requireRole('admin');
const teacherOrAdmin = requireRole('teacher', 'admin');
const student = requireRole('student');

// ---------- Schemas ----------
const DEPTS = ['CSE', 'CSE (AI & ML)', 'IT', 'ECE', 'ME', 'CE', 'B.Com', 'BBA', 'BCA'];
const s = {
  register: {
    name: { type: 'string', required: true, min: 2, max: 60 },
    role: { type: 'string', required: true, enum: ['student', 'teacher'] },
    department: { type: 'string', required: true, enum: DEPTS },
    semester: { type: 'number', min: 1, max: 8 },
    studentId: { type: 'string', max: 30 },
  },
  adminCreateUser: {
    name: { type: 'string', required: true, min: 2, max: 60 },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, min: 8, max: 64 },
    role: { type: 'string', required: true, enum: ['student', 'teacher'] },
    department: { type: 'string', required: true, enum: DEPTS },
    semester: { type: 'number', min: 1, max: 8 },
    studentId: { type: 'string', max: 30 },
  },
  adminUpdateUser: {
    name: { type: 'string', min: 2, max: 60 },
    department: { type: 'string', enum: DEPTS },
    semester: { type: 'number', min: 1, max: 8 },
    studentId: { type: 'string', max: 30 },
    status: { type: 'string', enum: ['active', 'inactive'] },
  },
  updateMe: {
    name: { type: 'string', min: 2, max: 60 },
    photoURL: { type: 'photo' },
  },
  subject: {
    name: { type: 'string', required: true, max: 80 },
    code: { type: 'string', required: true, max: 20 },
    department: { type: 'string', required: true, enum: DEPTS },
    semester: { type: 'number', required: true, min: 1, max: 8 },
    teacherId: { type: 'string', required: true },
  },
  attendance: {
    subjectId: { type: 'string', required: true },
    date: { type: 'string', required: true },
    records: { type: 'object', required: true },
  },
  assignment: {
    subjectId: { type: 'string', required: true },
    title: { type: 'string', required: true, max: 120 },
    description: { type: 'string', required: true, max: 2000 },
    dueDate: { type: 'string', required: true },
    attachmentPath: { type: 'fileref' },
  },
  submission: {
    assignmentId: { type: 'string', required: true },
    filePath: { type: 'fileref', required: true },
    fileName: { type: 'string', required: true, max: 200 },
  },
  submissionStatus: {
    status: { type: 'string', required: true, enum: ['submitted', 'reviewed', 'accepted', 'rejected'] },
    remarks: { type: 'string', max: 500 },
  },
  material: {
    subjectId: { type: 'string', required: true },
    title: { type: 'string', required: true, max: 120 },
    description: { type: 'string', max: 500 },
    filePath: { type: 'fileref', required: true },
  },
  notice: {
    title: { type: 'string', required: true, max: 120 },
    content: { type: 'string', required: true, max: 3000 },
    category: { type: 'string', required: true, enum: ['general', 'exam', 'holiday', 'important'] },
  },
  event: {
    title: { type: 'string', required: true, max: 120 },
    description: { type: 'string', required: true, max: 2000 },
    venue: { type: 'string', required: true, max: 120 },
    date: { type: 'string', required: true },
  },
  file: {
    name: { type: 'string', required: true, max: 150 },
    contentType: { type: 'string', required: true, max: 50 },
    kind: { type: 'string', required: true, enum: ['assignment', 'submission', 'material'] },
    data: { type: 'string', required: true, max: 1000000 },
  },
};

// ---------- Public ----------
router.get('/health', (req, res) => res.json({ status: 'ok', app: 'CampusHub API' }));

// ---------- Auth ----------
router.post('/auth/register', verifyTokenOnly, validate(s.register), h(authC.register));
router.get('/auth/me', verifyToken, authC.me);

// ---------- Files (Firestore me stored) ----------
router.post('/files', verifyToken, validate(s.file), h(fileC.uploadFile));
router.get('/files/:id', verifyToken, h(fileC.downloadFile));

// ---------- Users ----------
router.get('/users', verifyToken, admin, h(userC.listUsers));
router.post('/users', verifyToken, admin, validate(s.adminCreateUser), h(userC.createUser));
router.get('/students', verifyToken, teacherOrAdmin, h(userC.listStudents));
router.patch('/users/me', verifyToken, validate(s.updateMe), h(userC.updateMe));
router.patch('/users/:uid/approve', verifyToken, admin, h(userC.approveTeacher));
router.patch('/users/:uid', verifyToken, admin, validate(s.adminUpdateUser), h(userC.updateUser));

// ---------- Subjects ----------
router.get('/subjects', verifyToken, h(subjectC.listSubjects));
router.post('/subjects', verifyToken, admin, validate(s.subject), h(subjectC.createSubject));
router.put('/subjects/:id', verifyToken, admin, validate(s.subject), h(subjectC.updateSubject));
router.delete('/subjects/:id', verifyToken, admin, h(subjectC.deleteSubject));

// ---------- Attendance ----------
router.post('/attendance', verifyToken, teacherOrAdmin, validate(s.attendance), h(attC.saveAttendance));
router.get('/attendance', verifyToken, teacherOrAdmin, h(attC.listAttendance));
router.get('/attendance/my', verifyToken, student, h(attC.myAttendance));

// ---------- Assignments & Submissions ----------
router.get('/assignments', verifyToken, h(asgC.listAssignments));
router.post('/assignments', verifyToken, teacherOrAdmin, validate(s.assignment),
  fileC.requireOwnFile('assignment', 'attachmentPath', 'attachmentUrl'), h(asgC.createAssignment));
router.put('/assignments/:id', verifyToken, teacherOrAdmin, validate(s.assignment),
  fileC.requireOwnFile('assignment', 'attachmentPath', 'attachmentUrl'), h(asgC.updateAssignment));
router.delete('/assignments/:id', verifyToken, teacherOrAdmin, h(asgC.deleteAssignment));
router.get('/assignments/:id/submissions', verifyToken, teacherOrAdmin, h(asgC.assignmentSubmissions));

router.post('/submissions', verifyToken, student, validate(s.submission),
  fileC.requireOwnFile('submission', 'filePath', 'fileUrl'), h(asgC.submitAssignment));
router.get('/submissions/my', verifyToken, student, h(asgC.mySubmissions));
router.get('/submissions/recent', verifyToken, teacherOrAdmin, h(asgC.recentSubmissions));
router.patch('/submissions/:id/status', verifyToken, teacherOrAdmin, validate(s.submissionStatus), h(asgC.updateSubmissionStatus));

// ---------- Study materials ----------
router.get('/materials', verifyToken, h(matC.listMaterials));
router.post('/materials', verifyToken, teacherOrAdmin, validate(s.material),
  fileC.requireOwnFile('material', 'filePath', 'fileUrl'), h(matC.createMaterial));
router.delete('/materials/:id', verifyToken, teacherOrAdmin, h(matC.deleteMaterial));

// ---------- Notices ----------
router.get('/notices', verifyToken, h(notC.listNotices));
router.post('/notices', verifyToken, teacherOrAdmin, validate(s.notice), h(notC.createNotice));
router.put('/notices/:id', verifyToken, teacherOrAdmin, validate(s.notice), h(notC.updateNotice));
router.delete('/notices/:id', verifyToken, teacherOrAdmin, h(notC.deleteNotice));

// ---------- Events ----------
router.get('/events', verifyToken, h(evtC.listEvents));
router.post('/events', verifyToken, admin, validate(s.event), h(evtC.createEvent));
router.put('/events/:id', verifyToken, admin, validate(s.event), h(evtC.updateEvent));
router.delete('/events/:id', verifyToken, admin, h(evtC.deleteEvent));
router.post('/events/:id/register', verifyToken, student, h(evtC.registerForEvent));
router.delete('/events/:id/register', verifyToken, student, h(evtC.cancelRegistration));
router.get('/events/:id/registrations', verifyToken, admin, h(evtC.eventRegistrations));

// ---------- Stats ----------
router.get('/stats/overview', verifyToken, h(statC.overview));

module.exports = router;
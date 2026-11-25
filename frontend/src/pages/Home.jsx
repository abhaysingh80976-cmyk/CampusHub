import { Link } from 'react-router-dom';
import {
  CalendarCheck, ClipboardList, BookOpen, Megaphone, CalendarDays, ShieldCheck,
  Sparkles, CheckCircle2, ArrowRight,
} from 'lucide-react';

const FEATURES = [
  { icon: CalendarCheck, title: 'Attendance Tracking', text: 'Teachers mark attendance in seconds. Students see subject-wise percentage and full history.' },
  { icon: ClipboardList, title: 'Assignment Management', text: 'Create assignments, set deadlines, collect submissions and review them in one place.' },
  { icon: BookOpen, title: 'Study Materials', text: 'Share PDF notes by subject and semester. Students can search and download anytime.' },
  { icon: Megaphone, title: 'Notice Board', text: 'Exam, holiday and important notices reach everyone instantly with a notification bell.' },
  { icon: CalendarDays, title: 'Events & Registration', text: 'Admins publish college events and students register with one click.' },
  { icon: ShieldCheck, title: 'Secure & Role-based', text: 'Every request is verified on the server. Each role sees only what it is allowed to.' },
];

const STUDENT_POINTS = [
  'See attendance and pending work at a glance',
  'Submit assignments online before the deadline',
  'Download notes and study materials any time',
  'Never miss an exam notice or college event',
];
const TEACHER_POINTS = [
  'Mark and edit attendance without paperwork',
  'Create assignments and review submissions',
  'Upload notes for the right subject and semester',
  'Publish notices to students instantly',
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-badge"><Sparkles size={16} /> Smart College Management Portal</span>
            <h1>Run your campus <span>smarter</span>, not harder.</h1>
            <p className="lead">
              CampusHub connects students, teachers and administrators on one platform: attendance,
              assignments, study materials, notices and events.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">Get Started <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn btn-outline">Login</Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="between">
              <strong>Student Dashboard</strong>
              <span className="badge badge-success">Live preview</span>
            </div>
            <div className="mini-stats">
              <div className="mini-stat"><strong>92%</strong><span>Attendance</span></div>
              <div className="mini-stat"><strong>2</strong><span>Pending</span></div>
              <div className="mini-stat"><strong>3</strong><span>Events</span></div>
            </div>
            <div className="list">
              <div className="list-item"><span>Linear Regression Assignment</span><span className="badge badge-warning">Due soon</span></div>
              <div className="list-item"><span>Mid-Semester Exam Schedule</span><span className="badge badge-danger">Exam</span></div>
              <div className="list-item"><span>TechFest 2026</span><span className="badge badge-info">Event</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-title">
            <h2>Everything your college needs</h2>
            <p className="muted">Replace registers, notice boards and scattered chat groups with one clean system.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="card feature-card" key={title}>
                <div className="feature-icon"><Icon size={26} /></div>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-title">
            <h2>Built for both sides of the classroom</h2>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3>For Students</h3>
              <ul className="check-list">
                {STUDENT_POINTS.map((p) => <li key={p}><CheckCircle2 size={18} /> {p}</li>)}
              </ul>
            </div>
            <div className="card">
              <h3>For Teachers</h3>
              <ul className="check-list">
                {TEACHER_POINTS.map((p) => <li key={p}><CheckCircle2 size={18} /> {p}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>Ready to bring your campus online?</h2>
            <p style={{ opacity: 0.9 }}>Create a free student or teacher account in under a minute.</p>
            <div className="row-gap center">
              <Link to="/register" className="btn btn-outline">Create account</Link>
              <Link to="/about" className="btn btn-outline">Learn more</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
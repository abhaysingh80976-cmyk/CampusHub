import { Target, Eye, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  'Role-based dashboards for students, teachers and admins',
  'Attendance marking, reports and subject-wise percentage',
  'Assignments with attachments, submissions and review status',
  'Study material sharing with search and filters',
  'Notice board and notification bell',
  'Event creation and student registration',
  'Light and dark mode with a responsive layout',
  'Secure Firebase login with server-side role verification',
];

export default function About() {
  return (
    <>
      <section className="page-hero container">
        <h1>About <span className="gradient-text">CampusHub</span></h1>
        <p className="muted" style={{ maxWidth: 680, margin: '0 auto' }}>
          CampusHub is a centralized digital platform that simplifies everyday college activities
          and connects students, teachers and administrators.
        </p>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="card" style={{ marginBottom: 24 }}>
            <h2>Project Objective</h2>
            <p className="muted">
              Colleges still depend on paper registers, notice boards and chat groups. This makes it
              hard to track attendance, share notes or collect assignments. CampusHub brings all of
              this into one secure web application, so information is always accurate, organized and
              available to the right people.
            </p>
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="feature-icon"><Target size={26} /></div>
              <h3>Our Mission</h3>
              <p className="muted">
                To make college administration simple, transparent and paperless, so teachers can
                focus on teaching and students can focus on learning.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon"><Eye size={26} /></div>
              <h3>Our Vision</h3>
              <p className="muted">
                A smart campus where every student, teacher and administrator has the right
                information at the right time, on any device.
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Platform Features</h2>
            <ul className="check-list" style={{ marginTop: 14 }}>
              {FEATURES.map((f) => <li key={f}><CheckCircle2 size={18} /> {f}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
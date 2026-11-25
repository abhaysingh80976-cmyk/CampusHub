import { Link } from 'react-router-dom';
import { GraduationCap, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthShell({ title, subtitle, children, footer }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/" className="brand brand-light">
          <GraduationCap size={30} /> <span>CampusHub</span>
        </Link>
        <div>
          <h2>One portal for your whole campus.</h2>
          <p>Attendance, assignments, notes, notices and events, all in one secure place.</p>
          <ul className="auth-points">
            <li><CheckCircle2 size={18} /> Separate dashboards for students, teachers and admins</li>
            <li><CheckCircle2 size={18} /> Secure login powered by Firebase</li>
            <li><CheckCircle2 size={18} /> Works on mobile, tablet and desktop</li>
          </ul>
        </div>
        <small>© {new Date().getFullYear()} CampusHub</small>
      </aside>

      <main className="auth-main">
        <button className="btn-icon auth-theme" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
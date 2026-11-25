import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { GraduationCap, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { roleHome } from '../utils/helpers';

export default function PublicLayout() {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="public-shell">
      <header className="public-nav">
        <div className="container public-nav-inner">
          <Link to="/" className="brand" onClick={close}>
            <GraduationCap size={28} /> <span>CampusHub</span>
          </Link>

          <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
            <NavLink to="/" end onClick={close}>Home</NavLink>
            <NavLink to="/about" onClick={close}>About</NavLink>
            <NavLink to="/contact" onClick={close}>Contact</NavLink>
            <div className="nav-cta">
              {profile ? (
                <Link to={roleHome[profile.role]} className="btn btn-primary" onClick={close}>Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline" onClick={close}>Login</Link>
                  <Link to="/register" className="btn btn-primary" onClick={close}>Get Started</Link>
                </>
              )}
            </div>
          </nav>

          <div className="nav-tools">
            <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="btn-icon nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand"><GraduationCap size={26} /> <span>CampusHub</span></div>
            <p className="muted">Smart College Management Portal connecting students, teachers and administrators.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Get Started</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Student Registration</Link>
            <Link to="/register?role=teacher">Teacher Registration</Link>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} CampusHub · College Mini Project</div>
      </footer>
    </div>
  );
}

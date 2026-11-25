import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { NAV } from '../utils/navigation';
import Avatar from '../components/Avatar';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';

export default function DashboardLayout() {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <GraduationCap size={28} />
          <span>CampusHub</span>
          <button className="btn-icon menu-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <span className="role-pill">{profile.role} panel</span>
        <nav className="sidebar-nav">
          {(NAV[profile.role] || []).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link logout-link" onClick={handleLogout}>
            <LogOut size={19} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button className="btn-icon menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <GlobalSearch />
          <div className="topbar-actions">
            <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <NotificationBell />
            <div className="user-chip">
              <Avatar src={profile.photoURL} name={profile.name} size={36} />
              <div className="user-chip-text">
                <strong>{profile.name}</strong>
                <small className="muted">{profile.email}</small>
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

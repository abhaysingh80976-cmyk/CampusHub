import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../services/api';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';
import { roleHome, timeAgo, categoryVariant } from '../utils/helpers';

export default function NotificationBell() {
  const { profile } = useAuth();
  const storageKey = `campushub-notif-seen-${profile.uid}`;
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem(storageKey) || '');
  const ref = useRef(null);

  useEffect(() => {
    api.get('/notices', { params: { limit: 5 } }).then((r) => setItems(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = items.filter((n) => !lastSeen || n.createdAt > lastSeen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items.length) {
      const newest = items[0].createdAt;
      localStorage.setItem(storageKey, newest);
      setLastSeen(newest);
    }
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="btn-icon" onClick={toggle} aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <span className="notif-dot">{unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-title">Latest Notices</div>
          {items.length === 0 && <p className="muted pad">No notifications</p>}
          {items.map((n) => (
            <div key={n.id} className="notif-item">
              <div className="notif-row">
                <strong>{n.title}</strong>
                <Badge variant={categoryVariant(n.category)}>{n.category}</Badge>
              </div>
              <small className="muted">{timeAgo(n.createdAt)} · {n.createdByName}</small>
            </div>
          ))}
          <Link className="notif-footer" to={`${roleHome[profile.role]}/notices`} onClick={() => setOpen(false)}>
            View all notices
          </Link>
        </div>
      )}
    </div>
  );
}

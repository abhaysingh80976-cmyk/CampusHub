import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Megaphone, CalendarDays, ClipboardList } from 'lucide-react';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../utils/helpers';

const SECTIONS = [
  { key: 'materials', label: 'Study Materials', icon: FileText, path: '/materials' },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList, path: '/assignments' },
  { key: 'notices', label: 'Notices', icon: Megaphone, path: '/notices' },
  { key: 'events', label: 'Events', icon: CalendarDays, path: '/events' },
];

export default function GlobalSearch() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const base = roleHome[profile.role];
  const sections = SECTIONS.filter((s) => !(profile.role === 'teacher' && s.key === 'events'));

  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 400);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const term = debounced.trim().toLowerCase();
    if (term.length < 2) {
      setResults(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const match = (item, fields) => fields.some((f) => String(item[f] || '').toLowerCase().includes(term));

    Promise.allSettled([
      api.get('/materials', { params: { q: term, limit: 5 } }),
      api.get('/assignments'),
      api.get('/notices', { params: { limit: 100 } }),
      api.get('/events'),
    ]).then(([m, a, n, e]) => {
      if (cancelled) return;
      const get = (r) => (r.status === 'fulfilled' ? r.value.data : null);
      const mats = get(m)?.data || [];
      const asg = get(a) || [];
      const not = get(n)?.data || [];
      const evt = get(e) || [];
      setResults({
        materials: mats.slice(0, 4),
        assignments: asg.filter((x) => match(x, ['title', 'description', 'subjectName'])).slice(0, 4),
        notices: not.filter((x) => match(x, ['title', 'content'])).slice(0, 4),
        events: evt.filter((x) => match(x, ['title', 'description', 'venue'])).slice(0, 4),
      });
      setLoading(false);
      setOpen(true);
    });
    return () => { cancelled = true; };
  }, [debounced]);

  const go = (path) => {
    setOpen(false);
    setQ('');
    setResults(null);
    navigate(base + path);
  };

  const total = results ? sections.reduce((n, s) => n + results[s.key].length, 0) : 0;

  return (
    <div className="global-search" ref={wrapRef}>
      <Search size={18} />
      <input
        type="search"
        placeholder="Search materials, notices, events..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results && setOpen(true)}
      />
      {open && (
        <div className="search-dropdown">
          {loading && <p className="muted pad">Searching...</p>}
          {!loading && total === 0 && <p className="muted pad">No results found</p>}
          {!loading &&
            sections.map(({ key, label, icon: Icon, path }) =>
              results[key].length ? (
                <div key={key} className="search-group">
                  <div className="search-group-title">{label}</div>
                  {results[key].map((item) => (
                    <button key={item.id} className="search-item" onClick={() => go(path)}>
                      <Icon size={16} /> <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              ) : null
            )}
        </div>
      )}
    </div>
  );
}

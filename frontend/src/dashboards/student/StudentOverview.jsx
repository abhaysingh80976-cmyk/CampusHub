import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ClipboardList, CalendarDays, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import { formatDate, formatDateTime, timeAgo, categoryVariant } from '../../utils/helpers';

export default function StudentOverview() {
  const { profile } = useAuth();
  const stats = useFetch('/stats/overview');
  const att = useFetch('/attendance/my');
  const asg = useFetch('/assignments');
  const subs = useFetch('/submissions/my');
  const notices = useFetch('/notices', { limit: 4 });
  const events = useFetch('/events');

  const loading = stats.loading || att.loading || asg.loading || subs.loading || notices.loading || events.loading;
  const error = stats.error || att.error || asg.error || subs.error || notices.error || events.error;
  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => { stats.reload(); att.reload(); asg.reload(); subs.reload(); notices.reload(); events.reload(); }} />;

  const done = new Set((subs.data || []).map((s) => s.assignmentId));
  const pending = (asg.data || [])
    .filter((a) => !done.has(a.id))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  const upcoming = (events.data || []).filter((e) => new Date(e.date) >= new Date()).slice(0, 3);
  const chart = (att.data?.subjects || []).map((s) => ({ name: s.subjectName.split(' ')[0], percentage: s.percentage }));

  return (
    <>
      <PageHeader title={`Welcome, ${profile.name.split(' ')[0]}!`} subtitle="Here is what is happening on your campus today." />

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="cell-user">
          <Avatar src={profile.photoURL} name={profile.name} size={60} />
          <div>
            <h3 style={{ marginBottom: 2 }}>{profile.name}</h3>
            <span className="muted">
              {profile.studentId} · {profile.department} · Semester {profile.semester}
            </span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={BookOpen} label="Total subjects" value={stats.data?.subjects} color="indigo" />
        <StatCard icon={CalendarCheck} label="Attendance" value={`${att.data?.overall ?? 0}%`} color="green" />
        <StatCard icon={ClipboardList} label="Pending assignments" value={stats.data?.pendingAssignments} color="orange" />
        <StatCard icon={CalendarDays} label="Upcoming events" value={stats.data?.upcomingEvents} color="purple" />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title"><h3>Subject-wise attendance</h3><Link to="/student/attendance">View all</Link></div>
          {chart.length === 0 ? (
            <p className="muted">No attendance recorded yet.</p>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {chart.map((c) => <Cell key={c.name} fill={c.percentage < 75 ? '#dc2626' : '#4f46e5'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h3>Pending assignments</h3><Link to="/student/assignments">View all</Link></div>
          {pending.length === 0 ? (
            <p className="muted">You are all caught up!</p>
          ) : (
            <div className="list">
              {pending.map((a) => (
                <div className="list-item" key={a.id}>
                  <div><strong>{a.title}</strong><br /><small className="muted">{a.subjectName}</small></div>
                  <Badge variant={new Date(a.dueDate) < new Date() ? 'danger' : 'warning'}>Due {formatDate(a.dueDate)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title"><h3><Megaphone size={16} /> Latest notices</h3><Link to="/student/notices">View all</Link></div>
          {(notices.data?.data || []).length === 0 ? (
            <p className="muted">No notices yet.</p>
          ) : (
            <div className="list">
              {notices.data.data.map((n) => (
                <div className="list-item" key={n.id}>
                  <div><strong>{n.title}</strong><br /><small className="muted">{timeAgo(n.createdAt)}</small></div>
                  <Badge variant={categoryVariant(n.category)}>{n.category}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h3>Upcoming events</h3><Link to="/student/events">View all</Link></div>
          {upcoming.length === 0 ? (
            <p className="muted">No upcoming events.</p>
          ) : (
            <div className="list">
              {upcoming.map((e) => (
                <div className="list-item" key={e.id}>
                  <div><strong>{e.title}</strong><br /><small className="muted">{formatDateTime(e.date)} · {e.venue}</small></div>
                  {e.registered && <Badge variant="success">Registered</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

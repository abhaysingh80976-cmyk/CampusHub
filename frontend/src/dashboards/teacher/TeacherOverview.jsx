import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, FileCheck, CalendarCheck, Megaphone } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import Badge from '../../components/Badge';
import { statusVariant, timeAgo, categoryVariant } from '../../utils/helpers';

export default function TeacherOverview() {
  const { profile } = useAuth();
  const stats = useFetch('/stats/overview');
  const recent = useFetch('/submissions/recent');
  const notices = useFetch('/notices', { limit: 4 });

  if (stats.loading || recent.loading || notices.loading) return <Spinner label="Loading dashboard..." />;
  const error = stats.error || recent.error || notices.error;
  if (error) return <ErrorState message={error} onRetry={() => { stats.reload(); recent.reload(); notices.reload(); }} />;

  const s = stats.data || {};

  return (
    <>
      <PageHeader title={`Welcome, ${profile.name.split(' ')[0]}!`} subtitle="Your classes at a glance" />

      <div className="stats-grid">
        <StatCard icon={Users} label="Assigned students" value={s.students} color="indigo" />
        <StatCard icon={BookOpen} label="My subjects" value={s.subjects} color="purple" />
        <StatCard icon={ClipboardList} label="Active assignments" value={s.activeAssignments} color="orange" />
        <StatCard icon={FileCheck} label="Total submissions" value={s.submissions} color="green" />
      </div>

      <div className="row-gap" style={{ marginBottom: 24 }}>
        <Link to="/teacher/attendance" className="btn btn-primary"><CalendarCheck size={16} /> Mark attendance</Link>
        <Link to="/teacher/assignments" className="btn btn-outline"><ClipboardList size={16} /> New assignment</Link>
        <Link to="/teacher/notices" className="btn btn-outline"><Megaphone size={16} /> Post notice</Link>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title"><h3>Recent submissions</h3><Link to="/teacher/assignments">View all</Link></div>
          {(recent.data || []).length === 0 ? (
            <p className="muted">No submissions yet.</p>
          ) : (
            <div className="list">
              {recent.data.map((r) => (
                <div className="list-item" key={r.id}>
                  <div>
                    <strong>{r.studentName}</strong>
                    <br /><small className="muted">{r.assignmentTitle} · {timeAgo(r.submittedAt)}</small>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h3>Latest notices</h3><Link to="/teacher/notices">View all</Link></div>
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
      </div>
    </>
  );
}

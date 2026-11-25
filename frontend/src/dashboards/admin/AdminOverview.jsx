import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, ClipboardList, BookOpen, CalendarDays, Megaphone, Layers, UserCheck, UserPlus, FileCheck,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import { timeAgo } from '../../utils/helpers';

const ICON = { user: UserPlus, notice: Megaphone, submission: FileCheck };

export default function AdminOverview() {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useFetch('/stats/overview');

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const chart = [
    { name: 'Students', value: data.students },
    { name: 'Teachers', value: data.teachers },
    { name: 'Subjects', value: data.subjects },
    { name: 'Assignments', value: data.assignments },
    { name: 'Materials', value: data.materials },
    { name: 'Notices', value: data.notices },
    { name: 'Events', value: data.events },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${profile.name.split(' ')[0]}!`} subtitle="Campus overview" />

      {data.pendingTeachers > 0 && (
        <div className="notice-box" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span><UserCheck size={16} style={{ verticalAlign: '-3px' }} /> {data.pendingTeachers} teacher account(s) waiting for your approval.</span>
          <Link to="/admin/teachers" className="btn btn-primary btn-sm">Review now</Link>
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={Users} label="Total students" value={data.students} color="indigo" />
        <StatCard icon={GraduationCap} label="Total teachers" value={data.teachers} color="purple" />
        <StatCard icon={Layers} label="Subjects" value={data.subjects} color="blue" />
        <StatCard icon={ClipboardList} label="Assignments" value={data.assignments} color="orange" />
        <StatCard icon={BookOpen} label="Study materials" value={data.materials} color="green" />
        <StatCard icon={CalendarDays} label="Events" value={data.events} color="red" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Platform summary</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chart}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Recent activity</h3>
          {(data.activity || []).length === 0 ? (
            <p className="muted">No activity yet.</p>
          ) : (
            <div className="list">
              {data.activity.map((a, i) => {
                const Icon = ICON[a.type] || UserPlus;
                return (
                  <div className="list-item" key={i}>
                    <div className="cell-user"><Icon size={16} /> <span>{a.text}</span></div>
                    <small className="muted" style={{ whiteSpace: 'nowrap' }}>{timeAgo(a.time)}</small>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

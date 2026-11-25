import { useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { formatDate, statusVariant } from '../../utils/helpers';

const level = (p) => (p < 60 ? 'low' : p < 75 ? 'mid' : '');

export default function StudentAttendance() {
  const { data, loading, error, reload } = useFetch('/attendance/my');
  const [open, setOpen] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const subjects = data?.subjects || [];

  return (
    <>
      <PageHeader title="My Attendance" subtitle={`Overall attendance: ${data?.overall ?? 0}%`} />

      {subjects.length === 0 ? (
        <div className="card">
          <EmptyState icon={CalendarCheck} title="No attendance yet" message="Your teachers have not marked attendance so far." />
        </div>
      ) : (
        <div className="item-grid">
          {subjects.map((s) => (
            <div className="card" key={s.subjectId}>
              <div className="between">
                <h3 style={{ margin: 0 }}>{s.subjectName}</h3>
                <Badge variant={s.percentage >= 75 ? 'success' : s.percentage >= 60 ? 'warning' : 'danger'}>{s.percentage}%</Badge>
              </div>
              <div className={`progress ${level(s.percentage)}`} style={{ margin: '14px 0' }}><span style={{ width: `${s.percentage}%` }} /></div>
              <div className="between muted" style={{ fontSize: '0.88rem' }}>
                <span>Total: <strong>{s.total}</strong></span>
                <span>Present: <strong>{s.present}</strong></span>
                <span>Absent: <strong>{s.absent}</strong></span>
              </div>
              {s.percentage < 75 && <p className="field-error" style={{ marginTop: 10 }}>Below 75%. Attend more classes to avoid shortage.</p>}
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setOpen(s)}>View history</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!open} title={open ? `${open.subjectName} history` : ''} onClose={() => setOpen(null)}>
        {open && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {open.history.map((h) => (
                  <tr key={h.date}><td>{formatDate(h.date)}</td><td><Badge variant={statusVariant(h.status)}>{h.status}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}

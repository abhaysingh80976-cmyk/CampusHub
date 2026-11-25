import { useState } from 'react';
import { CalendarCheck, Eye } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { SEMESTERS, formatDate, statusVariant } from '../../utils/helpers';

const PER_PAGE = 10;

export default function AdminAttendance() {
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const subjects = useFetch('/subjects');
  const students = useFetch('/users', { role: 'student', limit: 100 });
  const att = useFetch('/attendance', { subjectId, semester, date });

  const nameOf = Object.fromEntries((students.data?.data || []).map((s) => [s.uid, s]));
  const rows = att.data || [];
  const pages = Math.max(Math.ceil(rows.length / PER_PAGE), 1);
  const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const change = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <PageHeader title="Attendance Records" subtitle="View attendance marked by teachers" />

      <div className="toolbar">
        <select value={subjectId} onChange={change(setSubjectId)}>
          <option value="">All subjects</option>
          {(subjects.data || []).map((s) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
        </select>
        <select value={semester} onChange={change(setSemester)}>
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <input type="date" value={date} onChange={change(setDate)} />
        {(subjectId || semester || date) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setSubjectId(''); setSemester(''); setDate(''); setPage(1); }}>Clear filters</button>
        )}
      </div>

      {att.loading ? <Spinner /> : att.error ? <ErrorState message={att.error} onRetry={att.reload} /> : rows.length === 0 ? (
        <div className="card"><EmptyState icon={CalendarCheck} title="No records" message="No attendance matches these filters." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Subject</th><th>Sem</th><th>Present</th><th>Absent</th><th></th></tr></thead>
              <tbody>
                {visible.map((r) => {
                  const vals = Object.values(r.records || {});
                  const present = vals.filter((v) => v === 'present').length;
                  return (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td><strong>{r.subjectName}</strong></td>
                      <td>{r.semester}</td>
                      <td><Badge variant="success">{present}</Badge></td>
                      <td><Badge variant="danger">{vals.length - present}</Badge></td>
                      <td><button className="btn btn-outline btn-sm" onClick={() => setViewing(r)}><Eye size={14} /> Details</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </div>
      )}

      <Modal open={!!viewing} title={viewing ? `${viewing.subjectName} · ${formatDate(viewing.date)}` : ''} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Student</th><th>ID</th><th>Status</th></tr></thead>
              <tbody>
                {Object.entries(viewing.records).map(([uid, st]) => (
                  <tr key={uid}>
                    <td>{nameOf[uid]?.name || 'Unknown student'}</td>
                    <td>{nameOf[uid]?.studentId || '—'}</td>
                    <td><Badge variant={statusVariant(st)}>{st}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}

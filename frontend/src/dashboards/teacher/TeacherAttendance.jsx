import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCheck, Save } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { formatDate, todayISO } from '../../utils/helpers';

export default function TeacherAttendance() {
  const toast = useToast();
  const subjects = useFetch('/subjects');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState('mark');
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  const subject = (subjects.data || []).find((s) => s.id === subjectId);
  const students = useFetch('/students', { semester: subject?.semester, department: subject?.department, limit: 100 }, !!subject);
  const att = useFetch('/attendance', { subjectId }, !!subjectId);

  const existing = (att.data || []).find((r) => r.date === date);

  // Student list ya date badalne par marks dobara set karo (purani attendance ho to wahi dikhao)
  useEffect(() => {
    if (!students.data) return;
    const next = {};
    students.data.data.forEach((s) => { next[s.uid] = existing?.records?.[s.uid] || 'present'; });
    setMarks(next);
  }, [students.data, att.data, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = students.data?.data || [];
  const presentCount = Object.values(marks).filter((v) => v === 'present').length;

  const report = useMemo(
    () => list.map((s) => {
      let present = 0;
      let total = 0;
      (att.data || []).forEach((r) => {
        const v = r.records?.[s.uid];
        if (v) { total += 1; if (v === 'present') present += 1; }
      });
      return { ...s, present, total, pct: total ? Math.round((present / total) * 100) : 0 };
    }),
    [list, att.data]
  );

  const setAll = (value) => {
    const next = {};
    list.forEach((s) => { next[s.uid] = value; });
    setMarks(next);
  };

  const save = async () => {
    if (!list.length) return;
    setSaving(true);
    try {
      await api.post('/attendance', { subjectId, date, records: marks });
      toast.success(existing ? 'Attendance updated' : 'Attendance saved');
      att.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (subjects.loading) return <Spinner />;
  if (subjects.error) return <ErrorState message={subjects.error} onRetry={subjects.reload} />;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark, edit and review attendance for your subjects" />

      {(subjects.data || []).length === 0 ? (
        <div className="card"><EmptyState icon={CalendarCheck} title="No subjects assigned" message="Ask the admin to assign subjects to you." /></div>
      ) : (
        <>
          <div className="toolbar">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Select subject</option>
              {subjects.data.map((s) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
            </select>
            {tab === 'mark' && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
            <div className="tabs" style={{ margin: 0 }}>
              <button className={`tab ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>Mark attendance</button>
              <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Reports</button>
            </div>
          </div>

          {!subject ? (
            <div className="card"><EmptyState icon={CalendarCheck} title="Select a subject" message="Choose a subject to continue." /></div>
          ) : students.loading || att.loading ? (
            <Spinner />
          ) : students.error || att.error ? (
            <ErrorState message={students.error || att.error} onRetry={() => { students.reload(); att.reload(); }} />
          ) : list.length === 0 ? (
            <div className="card"><EmptyState title="No students" message="No students are registered for this subject's semester and department." /></div>
          ) : tab === 'mark' ? (
            <div className="card">
              <div className="between" style={{ marginBottom: 14 }}>
                <div>
                  <strong>{subject.name}</strong> · {formatDate(date)}{' '}
                  {existing && <Badge variant="info">Editing saved record</Badge>}
                  <br /><small className="muted">Present: {presentCount} / {list.length}</small>
                </div>
                <div className="row-gap">
                  <button className="btn btn-outline btn-sm" onClick={() => setAll('present')}><CheckCheck size={14} /> All present</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setAll('absent')}>All absent</button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Student</th><th>ID</th><th>Attendance</th></tr></thead>
                  <tbody>
                    {list.map((s) => (
                      <tr key={s.uid}>
                        <td><div className="cell-user"><Avatar src={s.photoURL} name={s.name} size={32} /><strong>{s.name}</strong></div></td>
                        <td>{s.studentId}</td>
                        <td>
                          <div className="row-gap">
                            <button className={`btn btn-sm ${marks[s.uid] === 'present' ? 'btn-success' : 'btn-outline'}`} onClick={() => setMarks({ ...marks, [s.uid]: 'present' })}>Present</button>
                            <button className={`btn btn-sm ${marks[s.uid] === 'absent' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setMarks({ ...marks, [s.uid]: 'absent' })}>Absent</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16 }}>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : existing ? 'Update attendance' : 'Save attendance'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
              <div className="card">
                <h3>Student-wise report</h3>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Student</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
                    <tbody>
                      {report.map((r) => (
                        <tr key={r.uid}>
                          <td>{r.name}<br /><small className="muted">{r.studentId}</small></td>
                          <td>{r.present}</td>
                          <td>{r.total}</td>
                          <td><Badge variant={r.total === 0 ? 'neutral' : r.pct >= 75 ? 'success' : r.pct >= 60 ? 'warning' : 'danger'}>{r.total ? `${r.pct}%` : '—'}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3>Classes held</h3>
                {(att.data || []).length === 0 ? <p className="muted">No classes recorded yet.</p> : (
                  <div className="list">
                    {att.data.map((r) => {
                      const vals = Object.values(r.records || {});
                      return (
                        <div className="list-item" key={r.id}>
                          <span>{formatDate(r.date)}</span>
                          <Badge variant="info">{vals.filter((v) => v === 'present').length}/{vals.length} present</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

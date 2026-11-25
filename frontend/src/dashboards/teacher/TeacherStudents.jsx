import { useState } from 'react';
import { Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { DEPARTMENTS, SEMESTERS, statusVariant } from '../../utils/helpers';

export default function TeacherStudents() {
  const [q, setQ] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useFetch('/students', { q: dq, semester, department, page, limit: 10 });

  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <PageHeader title="Students" subtitle="Students of the classes you teach" />

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email or ID..." />
        <select value={semester} onChange={reset(setSemester)}>
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={department} onChange={reset(setDepartment)}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.data.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No students found" message="Students appear here once they match your subjects' semester and department." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Student</th><th>Student ID</th><th>Department</th><th>Semester</th><th>Status</th></tr></thead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s.uid}>
                    <td>
                      <div className="cell-user">
                        <Avatar src={s.photoURL} name={s.name} size={36} />
                        <div><strong>{s.name}</strong><br /><small className="muted">{s.email}</small></div>
                      </div>
                    </td>
                    <td>{s.studentId}</td>
                    <td>{s.department}</td>
                    <td>{s.semester}</td>
                    <td><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </div>
      )}
    </>
  );
}

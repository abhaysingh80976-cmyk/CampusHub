import { useState } from 'react';
import { ClipboardList, Download, Eye, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { downloadFile } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';
import { formatDate, formatDateTime, statusVariant, isOverdue } from '../../utils/helpers';

const PER_PAGE = 10;

export default function AdminAssignments() {
  const toast = useToast();
  const asg = useFetch('/assignments');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const subs = useFetch(`/assignments/${viewing?.id}/submissions`, {}, !!viewing);

  const term = q.trim().toLowerCase();
  const rows = (asg.data || []).filter((a) => !term || [a.title, a.subjectName, a.teacherName].some((v) => String(v || '').toLowerCase().includes(term)));
  const pages = Math.max(Math.ceil(rows.length / PER_PAGE), 1);
  const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/assignments/${deleting.id}`);
      toast.success('Assignment removed');
      setDeleting(null);
      asg.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const download = async (id, name) => {
    try { await downloadFile(id, name); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (asg.loading) return <Spinner />;
  if (asg.error) return <ErrorState message={asg.error} onRetry={asg.reload} />;

  return (
    <>
      <PageHeader title="Assignments" subtitle="Monitor all assignments and remove inappropriate content" />

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search title, subject or teacher..." />
      </div>

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No assignments" message="Nothing matches your search." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Title</th><th>Subject</th><th>Teacher</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.subjectName}<br /><small className="muted">Sem {a.semester}</small></td>
                    <td>{a.teacherName}</td>
                    <td>{formatDateTime(a.dueDate)}</td>
                    <td><Badge variant={isOverdue(a.dueDate) ? 'neutral' : 'warning'}>{isOverdue(a.dueDate) ? 'Closed' : 'Active'}</Badge></td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => setViewing(a)}><Eye size={14} /> View</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setDeleting(a)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </div>
      )}

      <Modal open={!!viewing} title={viewing ? viewing.title : ''} onClose={() => setViewing(null)} size="lg">
        {viewing && (
          <>
            <p className="muted">{viewing.description}</p>
            {viewing.attachmentPath && (
              <button className="btn btn-outline btn-sm" style={{ marginBottom: 14 }} onClick={() => download(viewing.attachmentPath, viewing.title)}>
                <Download size={14} /> Attachment
              </button>
            )}
            <h3>Submissions</h3>
            {subs.loading ? <Spinner /> : subs.error ? <ErrorState message={subs.error} onRetry={subs.reload} /> : (subs.data || []).length === 0 ? (
              <p className="muted">No submissions yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Student</th><th>Submitted</th><th>Status</th><th>File</th></tr></thead>
                  <tbody>
                    {subs.data.map((s) => (
                      <tr key={s.id}>
                        <td>{s.studentName}<br /><small className="muted">{s.studentRoll}</small></td>
                        <td>{formatDate(s.submittedAt)}</td>
                        <td><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => download(s.filePath, s.fileName)}><Download size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove assignment?"
        message={deleting ? `"${deleting.title}" and all its submissions will be permanently deleted.` : ''}
        confirmText="Delete"
        danger
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

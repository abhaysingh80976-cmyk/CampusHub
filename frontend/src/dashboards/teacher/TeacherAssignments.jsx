import { useState } from 'react';
import { ClipboardList, Download, Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { uploadFile, downloadFile } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import FileInput from '../../components/FileInput';
import Badge from '../../components/Badge';
import { formatDateTime, formatDate, toLocalInput, statusVariant, isOverdue } from '../../utils/helpers';

const EMPTY = { subjectId: '', title: '', description: '', dueDate: '' };

export default function TeacherAssignments() {
  const toast = useToast();
  const asg = useFetch('/assignments');
  const subjects = useFetch('/subjects');

  const [editing, setEditing] = useState(null); // null | 'new' | assignment
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [review, setReview] = useState({ status: 'reviewed', remarks: '' });

  const subs = useFetch(`/assignments/${viewing?.id}/submissions`, {}, !!viewing);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = () => {
    setForm({ ...EMPTY, subjectId: subjects.data?.[0]?.id || '' });
    setErrors({}); setFile(null); setProgress(0); setEditing('new');
  };
  const openEdit = (a) => {
    setForm({ subjectId: a.subjectId, title: a.title, description: a.description, dueDate: toLocalInput(a.dueDate) });
    setErrors({}); setFile(null); setProgress(0); setEditing(a);
  };
  const closeForm = () => { if (!saving) setEditing(null); };

  const validate = () => {
    const e = {};
    if (!form.subjectId) e.subjectId = 'Select a subject';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.dueDate) e.dueDate = 'Select a deadline';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        subjectId: form.subjectId,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: new Date(form.dueDate).toISOString(),
      };
      if (file) {
        const up = await uploadFile('assignment', file, setProgress);
        body.attachmentPath = up.id;
      }
      if (editing === 'new') await api.post('/assignments', body);
      else await api.put(`/assignments/${editing.id}`, body);
      toast.success(editing === 'new' ? 'Assignment created' : 'Assignment updated');
      setEditing(null);
      asg.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/assignments/${deleting.id}`);
      toast.success('Assignment deleted');
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

  const openReview = (s) => { setReviewing(s); setReview({ status: s.status === 'late' ? 'reviewed' : s.status, remarks: s.remarks || '' }); };

  const saveReview = async () => {
    setBusy(true);
    try {
      await api.patch(`/submissions/${reviewing.id}/status`, review);
      toast.success('Submission updated');
      setReviewing(null);
      subs.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (asg.loading || subjects.loading) return <Spinner />;
  if (asg.error || subjects.error) return <ErrorState message={asg.error || subjects.error} onRetry={() => { asg.reload(); subjects.reload(); }} />;

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Create assignments and review student submissions"
        actions={<button className="btn btn-primary" onClick={openNew} disabled={!(subjects.data || []).length}><Plus size={16} /> New assignment</button>}
      />

      {(asg.data || []).length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No assignments yet" message="Create your first assignment for a subject." /></div>
      ) : (
        <div className="item-grid">
          {asg.data.map((a) => (
            <div className="card" key={a.id}>
              <div className="between">
                <Badge variant="info">{a.subjectName}</Badge>
                <Badge variant={isOverdue(a.dueDate) ? 'neutral' : 'warning'}>{isOverdue(a.dueDate) ? 'Closed' : 'Active'}</Badge>
              </div>
              <h3 style={{ margin: '12px 0 6px' }}>{a.title}</h3>
              <p className="muted" style={{ fontSize: '0.9rem' }}>{a.description}</p>
              <p style={{ fontSize: '0.85rem' }}>Due: <strong>{formatDateTime(a.dueDate)}</strong></p>
              <div className="row-gap">
                <button className="btn btn-primary btn-sm" onClick={() => setViewing(a)}><Eye size={14} /> Submissions</button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}><Edit3 size={14} /> Edit</button>
                {a.attachmentPath && <button className="btn btn-outline btn-sm" onClick={() => download(a.attachmentPath, a.title)}><Download size={14} /></button>}
                <button className="btn btn-outline btn-sm" onClick={() => setDeleting(a)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing === 'new' ? 'New assignment' : 'Edit assignment'}
        onClose={closeForm}
        footer={
          <>
            <button className="btn btn-outline" onClick={closeForm} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? (file ? `Uploading ${progress}%` : 'Saving...') : 'Save'}</button>
          </>
        }
      >
        <div className="field">
          <label>Subject <span className="req">*</span></label>
          <select className={errors.subjectId ? 'input-error' : ''} value={form.subjectId} onChange={set('subjectId')} disabled={editing !== 'new'}>
            <option value="">Select subject</option>
            {(subjects.data || []).map((s) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
          </select>
          {errors.subjectId && <p className="field-error">{errors.subjectId}</p>}
        </div>
        <div className="field">
          <label>Title <span className="req">*</span></label>
          <input className={errors.title ? 'input-error' : ''} value={form.title} onChange={set('title')} maxLength={120} />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div className="field">
          <label>Description <span className="req">*</span></label>
          <textarea className={errors.description ? 'input-error' : ''} value={form.description} onChange={set('description')} maxLength={2000} />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>
        <div className="field">
          <label>Deadline <span className="req">*</span></label>
          <input type="datetime-local" className={errors.dueDate ? 'input-error' : ''} value={form.dueDate} onChange={set('dueDate')} />
          {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
        </div>
        <FileInput label={editing !== 'new' && editing?.attachmentPath ? 'Replace attachment (optional)' : 'Attachment (optional)'} kind="pdfOrImage" file={file} onChange={setFile} />
        {saving && file && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
      </Modal>

      <Modal open={!!viewing} title={viewing ? `Submissions: ${viewing.title}` : ''} onClose={() => setViewing(null)} size="lg">
        {subs.loading ? <Spinner /> : subs.error ? <ErrorState message={subs.error} onRetry={subs.reload} /> : (subs.data || []).length === 0 ? (
          <EmptyState title="No submissions yet" message="Students' submissions will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Student</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {subs.data.map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentName}<br /><small className="muted">{s.studentRoll}</small></td>
                    <td>{formatDate(s.submittedAt)}</td>
                    <td><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => download(s.filePath, s.fileName)}><Download size={14} /> File</button>
                        <button className="btn btn-primary btn-sm" onClick={() => openReview(s)}>Review</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal
        open={!!reviewing}
        title={reviewing ? `Review: ${reviewing.studentName}` : ''}
        onClose={() => setReviewing(null)}
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setReviewing(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={saveReview} disabled={busy}>{busy ? 'Saving...' : 'Update status'}</button>
          </>
        }
      >
        <div className="field">
          <label>Status</label>
          <select value={review.status} onChange={(e) => setReview({ ...review, status: e.target.value })}>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="field">
          <label>Remarks (optional)</label>
          <textarea value={review.remarks} onChange={(e) => setReview({ ...review, remarks: e.target.value })} maxLength={500} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete assignment?"
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

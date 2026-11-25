import { useState } from 'react';
import { BookOpen, Download, FileText, Plus, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import api, { getErrorMessage } from '../../services/api';
import { uploadFile, downloadFile } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import FileInput from '../../components/FileInput';
import Badge from '../../components/Badge';
import { formatDate } from '../../utils/helpers';

const EMPTY = { subjectId: '', title: '', description: '' };

export default function TeacherMaterials() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const subjects = useFetch('/subjects');
  const { data, loading, error, reload } = useFetch('/materials', { mine: true, q: dq, page, limit: 9 });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = () => {
    setForm({ ...EMPTY, subjectId: subjects.data?.[0]?.id || '' });
    setErrors({}); setFile(null); setProgress(0); setOpen(true);
  };

  const save = async () => {
    const e = {};
    if (!form.subjectId) e.subjectId = 'Select a subject';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!file) e.file = 'Choose a PDF file';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const up = await uploadFile('material', file, setProgress);
      await api.post('/materials', {
        subjectId: form.subjectId,
        title: form.title.trim(),
        description: form.description.trim(),
        filePath: up.id,
      });
      toast.success('Study material uploaded');
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/materials/${deleting.id}`);
      toast.success('Material deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const download = async (m) => {
    try { await downloadFile(m.filePath, `${m.title}.pdf`); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <PageHeader
        title="Study Materials"
        subtitle="Upload and manage your PDF notes"
        actions={<button className="btn btn-primary" onClick={openNew} disabled={!(subjects.data || []).length}><Plus size={16} /> Upload notes</button>}
      />

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search your uploads..." />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.data.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="No uploads yet" message="Upload your first PDF notes for students." /></div>
      ) : (
        <>
          <div className="item-grid">
            {data.data.map((m) => (
              <div className="card" key={m.id}>
                <div className="between"><Badge variant="info">{m.subjectName}</Badge><small className="muted">Sem {m.semester}</small></div>
                <h3 style={{ margin: '12px 0 6px' }}><FileText size={18} style={{ verticalAlign: '-3px' }} /> {m.title}</h3>
                {m.description && <p className="muted" style={{ fontSize: '0.9rem' }}>{m.description}</p>}
                <p className="muted" style={{ fontSize: '0.8rem' }}>Uploaded {formatDate(m.createdAt)}</p>
                <div className="row-gap">
                  <button className="btn btn-outline btn-sm" onClick={() => download(m)}><Download size={14} /> Download</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setDeleting(m)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      <Modal
        open={open}
        title="Upload study material"
        onClose={() => !saving && setOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? `Uploading ${progress}%` : 'Upload'}</button>
          </>
        }
      >
        <div className="field">
          <label>Subject <span className="req">*</span></label>
          <select className={errors.subjectId ? 'input-error' : ''} value={form.subjectId} onChange={set('subjectId')}>
            <option value="">Select subject</option>
            {(subjects.data || []).map((s) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
          </select>
          {errors.subjectId && <p className="field-error">{errors.subjectId}</p>}
        </div>
        <div className="field">
          <label>Title <span className="req">*</span></label>
          <input className={errors.title ? 'input-error' : ''} value={form.title} onChange={set('title')} maxLength={120} placeholder="e.g. Unit 1 Notes" />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={form.description} onChange={set('description')} maxLength={500} style={{ minHeight: 80 }} />
        </div>
        <FileInput label="PDF file" kind="pdf" file={file} onChange={setFile} required />
        {errors.file && <p className="field-error">{errors.file}</p>}
        {saving && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete material?"
        message={deleting ? `"${deleting.title}" will be permanently deleted.` : ''}
        confirmText="Delete"
        danger
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

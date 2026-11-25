import { useState } from 'react';
import { Edit3, Megaphone, Plus, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';
import { NOTICE_CATEGORIES, categoryVariant, formatDateTime } from '../../utils/helpers';

const EMPTY = { title: '', content: '', category: 'general' };

export default function AdminNotices() {
  const toast = useToast();
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/notices', { category, page, limit: 8 });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openNew = () => { setForm(EMPTY); setErrors({}); setEditing('new'); };
  const openEdit = (n) => { setForm({ title: n.title, content: n.content, category: n.category }); setErrors({}); setEditing(n); };

  const save = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.content.trim()) e.content = 'Content is required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const body = { title: form.title.trim(), content: form.content.trim(), category: form.category };
      if (editing === 'new') await api.post('/notices', body);
      else await api.put(`/notices/${editing.id}`, body);
      toast.success(editing === 'new' ? 'Notice published' : 'Notice updated');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/notices/${deleting.id}`);
      toast.success('Notice deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notices"
        subtitle="Publish, edit and delete announcements"
        actions={<button className="btn btn-primary" onClick={openNew}><Plus size={16} /> New notice</button>}
      />

      <div className="tabs">
        <button className={`tab ${category === '' ? 'active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>All</button>
        {NOTICE_CATEGORIES.map((c) => (
          <button key={c.value} className={`tab ${category === c.value ? 'active' : ''}`} onClick={() => { setCategory(c.value); setPage(1); }}>{c.label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.data.length === 0 ? (
        <div className="card"><EmptyState icon={Megaphone} title="No notices" message="Publish a notice for students and teachers." /></div>
      ) : (
        <>
          <div className="stack">
            {data.data.map((n) => (
              <div className="card" key={n.id}>
                <div className="between">
                  <h3 style={{ margin: 0 }}>{n.title}</h3>
                  <Badge variant={categoryVariant(n.category)}>{n.category}</Badge>
                </div>
                <p style={{ margin: '10px 0', whiteSpace: 'pre-wrap' }}>{n.content}</p>
                <div className="between">
                  <small className="muted">By {n.createdByName} ({n.createdByRole}) · {formatDateTime(n.createdAt)}</small>
                  <div className="row-gap">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(n)}><Edit3 size={14} /> Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setDeleting(n)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      <Modal
        open={!!editing}
        title={editing === 'new' ? 'New notice' : 'Edit notice'}
        onClose={() => !saving && setEditing(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing === 'new' ? 'Publish' : 'Save'}</button>
          </>
        }
      >
        <div className="field">
          <label>Title <span className="req">*</span></label>
          <input className={errors.title ? 'input-error' : ''} value={form.title} onChange={set('title')} maxLength={120} />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={set('category')}>
            {NOTICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Content <span className="req">*</span></label>
          <textarea className={errors.content ? 'input-error' : ''} value={form.content} onChange={set('content')} maxLength={3000} />
          {errors.content && <p className="field-error">{errors.content}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete notice?"
        message={deleting ? `"${deleting.title}" will be removed for everyone.` : ''}
        confirmText="Delete"
        danger
        loading={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

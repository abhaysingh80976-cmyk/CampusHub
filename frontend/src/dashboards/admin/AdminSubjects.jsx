import { useState } from 'react';
import { Edit3, Layers, Plus, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { DEPARTMENTS, SEMESTERS } from '../../utils/helpers';

const EMPTY = { name: '', code: '', department: '', semester: '', teacherId: '' };

export default function AdminSubjects() {
  const toast = useToast();
  const [semester, setSemester] = useState('');
  const subjects = useFetch('/subjects', { semester });
  const teachers = useFetch('/users', { role: 'teacher', status: 'active', limit: 100 });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const teacherList = teachers.data?.data || [];

  const openNew = () => { setForm(EMPTY); setErrors({}); setEditing('new'); };
  const openEdit = (s) => {
    setForm({ name: s.name, code: s.code, department: s.department, semester: s.semester, teacherId: s.teacherId });
    setErrors({});
    setEditing(s);
  };

  const save = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Subject name is required';
    if (!form.code.trim()) e.code = 'Subject code is required';
    if (!form.department) e.department = 'Select a department';
    if (!form.semester) e.semester = 'Select a semester';
    if (!form.teacherId) e.teacherId = 'Assign a teacher';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), code: form.code.trim(), department: form.department, semester: Number(form.semester), teacherId: form.teacherId };
      if (editing === 'new') await api.post('/subjects', body);
      else await api.put(`/subjects/${editing.id}`, body);
      toast.success(editing === 'new' ? 'Subject created' : 'Subject updated');
      setEditing(null);
      subjects.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/subjects/${deleting.id}`);
      toast.success('Subject deleted');
      setDeleting(null);
      subjects.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="Create subjects and assign them to teachers"
        actions={<button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add subject</button>}
      />

      <div className="toolbar">
        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {subjects.loading ? <Spinner /> : subjects.error ? <ErrorState message={subjects.error} onRetry={subjects.reload} /> : (subjects.data || []).length === 0 ? (
        <div className="card"><EmptyState icon={Layers} title="No subjects" message="Add a subject and assign a teacher." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Subject</th><th>Code</th><th>Department</th><th>Sem</th><th>Teacher</th><th>Actions</th></tr></thead>
              <tbody>
                {subjects.data.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.code}</td>
                    <td>{s.department}</td>
                    <td>{s.semester}</td>
                    <td>{s.teacherName}</td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}><Edit3 size={14} /> Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setDeleting(s)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing === 'new' ? 'Add subject' : 'Edit subject'}
        onClose={() => !saving && setEditing(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label>Subject name <span className="req">*</span></label>
            <input className={errors.name ? 'input-error' : ''} value={form.name} onChange={set('name')} maxLength={80} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="field">
            <label>Code <span className="req">*</span></label>
            <input className={errors.code ? 'input-error' : ''} value={form.code} onChange={set('code')} maxLength={20} placeholder="e.g. CSE501" />
            {errors.code && <p className="field-error">{errors.code}</p>}
          </div>
          <div className="field">
            <label>Department <span className="req">*</span></label>
            <select className={errors.department ? 'input-error' : ''} value={form.department} onChange={set('department')}>
              <option value="">Select</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="field-error">{errors.department}</p>}
          </div>
          <div className="field">
            <label>Semester <span className="req">*</span></label>
            <select className={errors.semester ? 'input-error' : ''} value={form.semester} onChange={set('semester')}>
              <option value="">Select</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            {errors.semester && <p className="field-error">{errors.semester}</p>}
          </div>
        </div>
        <div className="field">
          <label>Assigned teacher <span className="req">*</span></label>
          <select className={errors.teacherId ? 'input-error' : ''} value={form.teacherId} onChange={set('teacherId')}>
            <option value="">Select teacher</option>
            {teacherList.map((t) => <option key={t.uid} value={t.uid}>{t.name} ({t.department})</option>)}
          </select>
          {errors.teacherId && <p className="field-error">{errors.teacherId}</p>}
          {!teachers.loading && teacherList.length === 0 && <p className="field-error">No approved teachers yet. Approve a teacher first.</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete subject?"
        message={deleting ? `"${deleting.name}" will be deleted. Existing attendance records are kept.` : ''}
        confirmText="Delete"
        danger
        loading={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

import { useState } from 'react';
import { Check, Edit3, Plus, Power, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { isEmail, validatePassword } from '../../utils/validators';
import { DEPARTMENTS, SEMESTERS, statusVariant, formatDate } from '../../utils/helpers';

const EMPTY = { name: '', email: '', password: '', department: '', semester: '', studentId: '' };

export default function UserManager({ role }) {
  const isStudent = role === 'student';
  const label = isStudent ? 'Student' : 'Teacher';
  const toast = useToast();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useFetch('/users', { role, status, q: dq, page, limit: 10 });

  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { user, action }
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const tabs = isStudent ? ['', 'active', 'inactive'] : ['', 'active', 'pending', 'inactive'];

  const openNew = () => { setForm(EMPTY); setErrors({}); setEditing('new'); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', department: u.department, semester: u.semester || '', studentId: u.studentId || '' });
    setErrors({});
    setEditing(u);
  };

  const validate = () => {
    const e = {};
    const isNew = editing === 'new';
    if (form.name.trim().length < 2) e.name = 'Enter a valid name';
    if (isNew && !isEmail(form.email)) e.email = 'Enter a valid email';
    if (isNew) { const p = validatePassword(form.password); if (p) e.password = p; }
    if (!form.department) e.department = 'Select a department';
    if (isStudent) {
      if (!form.semester) e.semester = 'Select a semester';
      if (!form.studentId.trim()) e.studentId = 'Student ID is required';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), department: form.department };
      if (isStudent) { body.semester = Number(form.semester); body.studentId = form.studentId.trim(); }
      if (editing === 'new') {
        await api.post('/users', { ...body, email: form.email.trim(), password: form.password, role });
        toast.success(`${label} added`);
      } else {
        await api.patch(`/users/${editing.uid}`, body);
        toast.success(`${label} updated`);
      }
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async () => {
    const { user, action } = confirm;
    setBusy(true);
    try {
      if (action === 'approve') await api.patch(`/users/${user.uid}/approve`);
      else await api.patch(`/users/${user.uid}`, { status: action === 'deactivate' ? 'inactive' : 'active' });
      toast.success(action === 'approve' ? 'Teacher approved' : action === 'deactivate' ? 'Account deactivated' : 'Account activated');
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmText = { approve: 'Approve', activate: 'Activate', deactivate: 'Deactivate' };

  return (
    <>
      <PageHeader
        title={`${label}s`}
        subtitle={isStudent ? 'Manage all student accounts' : 'Approve registrations and manage teachers'}
        actions={<button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add {label.toLowerCase()}</button>}
      />

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email or ID..." />
        <div className="tabs" style={{ margin: 0 }}>
          {tabs.map((t) => (
            <button key={t || 'all'} className={`tab ${status === t ? 'active' : ''}`} onClick={() => { setStatus(t); setPage(1); }}>
              {t ? t[0].toUpperCase() + t.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.data.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title={`No ${label.toLowerCase()}s found`} message="Try a different search or filter." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{label}</th>
                  {isStudent && <th>ID</th>}
                  <th>Department</th>
                  {isStudent && <th>Sem</th>}
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div className="cell-user">
                        <Avatar src={u.photoURL} name={u.name} size={36} />
                        <div><strong>{u.name}</strong><br /><small className="muted">{u.email}</small></div>
                      </div>
                    </td>
                    {isStudent && <td>{u.studentId}</td>}
                    <td>{u.department}</td>
                    {isStudent && <td>{u.semester}</td>}
                    <td>{formatDate(u.createdAt)}</td>
                    <td><Badge variant={statusVariant(u.status)}>{u.status}</Badge></td>
                    <td>
                      <div className="cell-actions">
                        {u.status === 'pending' && (
                          <button className="btn btn-success btn-sm" onClick={() => setConfirm({ user: u, action: 'approve' })}><Check size={14} /> Approve</button>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}><Edit3 size={14} /> Edit</button>
                        {u.status === 'active' && (
                          <button className="btn btn-outline btn-sm" onClick={() => setConfirm({ user: u, action: 'deactivate' })}><Power size={14} /> Deactivate</button>
                        )}
                        {u.status === 'inactive' && (
                          <button className="btn btn-outline btn-sm" onClick={() => setConfirm({ user: u, action: 'activate' })}><Power size={14} /> Activate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing === 'new' ? `Add ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`}
        onClose={() => !saving && setEditing(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="field">
          <label>Full name <span className="req">*</span></label>
          <input className={errors.name ? 'input-error' : ''} value={form.name} onChange={set('name')} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div className="field">
          <label>Email {editing === 'new' && <span className="req">*</span>}</label>
          <input type="email" className={errors.email ? 'input-error' : ''} value={form.email} onChange={set('email')} disabled={editing !== 'new'} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        {editing === 'new' && (
          <div className="field">
            <label>Temporary password <span className="req">*</span></label>
            <input type="text" className={errors.password ? 'input-error' : ''} value={form.password} onChange={set('password')} placeholder="Min 8 chars, letters + numbers" />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Department <span className="req">*</span></label>
            <select className={errors.department ? 'input-error' : ''} value={form.department} onChange={set('department')}>
              <option value="">Select</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="field-error">{errors.department}</p>}
          </div>
          {isStudent && (
            <div className="field">
              <label>Semester <span className="req">*</span></label>
              <select className={errors.semester ? 'input-error' : ''} value={form.semester} onChange={set('semester')}>
                <option value="">Select</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              {errors.semester && <p className="field-error">{errors.semester}</p>}
            </div>
          )}
        </div>
        {isStudent && (
          <div className="field">
            <label>Student ID <span className="req">*</span></label>
            <input className={errors.studentId ? 'input-error' : ''} value={form.studentId} onChange={set('studentId')} />
            {errors.studentId && <p className="field-error">{errors.studentId}</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm ? `${confirmText[confirm.action]} account?` : ''}
        message={confirm ? `${confirmText[confirm.action]} ${confirm.user.name}'s account?` : ''}
        confirmText={confirm ? confirmText[confirm.action] : ''}
        danger={confirm?.action === 'deactivate'}
        loading={busy}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

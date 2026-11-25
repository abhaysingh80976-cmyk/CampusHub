import { useState } from 'react';
import { CalendarDays, Edit3, MapPin, Plus, Trash2, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';
import { formatDateTime, toLocalInput } from '../../utils/helpers';

const EMPTY = { title: '', description: '', venue: '', date: '' };

export default function AdminEvents() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/events');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const regs = useFetch(`/events/${viewing?.id}/registrations`, {}, !!viewing);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openNew = () => { setForm(EMPTY); setErrors({}); setEditing('new'); };
  const openEdit = (ev) => {
    setForm({ title: ev.title, description: ev.description, venue: ev.venue, date: toLocalInput(ev.date) });
    setErrors({});
    setEditing(ev);
  };

  const save = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.venue.trim()) e.venue = 'Venue is required';
    if (!form.date) e.date = 'Select date and time';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        venue: form.venue.trim(),
        date: new Date(form.date).toISOString(),
      };
      if (editing === 'new') await api.post('/events', body);
      else await api.put(`/events/${editing.id}`, body);
      toast.success(editing === 'new' ? 'Event created' : 'Event updated');
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
      await api.delete(`/events/${deleting.id}`);
      toast.success('Event deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Create events and view registered participants"
        actions={<button className="btn btn-primary" onClick={openNew}><Plus size={16} /> New event</button>}
      />

      {data.length === 0 ? (
        <div className="card"><EmptyState icon={CalendarDays} title="No events" message="Create the first college event." /></div>
      ) : (
        <div className="item-grid">
          {data.map((ev) => {
            const past = new Date(ev.date) < new Date();
            return (
              <div className="card" key={ev.id} style={past ? { opacity: 0.75 } : undefined}>
                <Badge variant={past ? 'neutral' : 'info'}>{past ? 'Completed' : 'Upcoming'}</Badge>
                <h3 style={{ margin: '12px 0 6px' }}>{ev.title}</h3>
                <p className="muted" style={{ fontSize: '0.9rem' }}>{ev.description}</p>
                <p style={{ fontSize: '0.86rem', margin: '4px 0' }}><CalendarDays size={14} style={{ verticalAlign: '-2px' }} /> {formatDateTime(ev.date)}</p>
                <p style={{ fontSize: '0.86rem', margin: '4px 0' }}><MapPin size={14} style={{ verticalAlign: '-2px' }} /> {ev.venue}</p>
                <div className="row-gap" style={{ marginTop: 10 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setViewing(ev)}><Users size={14} /> {ev.registrations} registered</button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(ev)}><Edit3 size={14} /> Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setDeleting(ev)}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing === 'new' ? 'New event' : 'Edit event'}
        onClose={() => !saving && setEditing(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
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
        <div className="form-grid">
          <div className="field">
            <label>Venue <span className="req">*</span></label>
            <input className={errors.venue ? 'input-error' : ''} value={form.venue} onChange={set('venue')} maxLength={120} />
            {errors.venue && <p className="field-error">{errors.venue}</p>}
          </div>
          <div className="field">
            <label>Date & time <span className="req">*</span></label>
            <input type="datetime-local" className={errors.date ? 'input-error' : ''} value={form.date} onChange={set('date')} />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>
        </div>
      </Modal>

      <Modal open={!!viewing} title={viewing ? `Participants: ${viewing.title}` : ''} onClose={() => setViewing(null)}>
        {regs.loading ? <Spinner /> : regs.error ? <ErrorState message={regs.error} onRetry={regs.reload} /> : (regs.data || []).length === 0 ? (
          <EmptyState title="No registrations yet" message="Students who register will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Student</th><th>ID</th><th>Registered</th></tr></thead>
              <tbody>
                {regs.data.map((r) => (
                  <tr key={r.id}><td>{r.studentName}</td><td>{r.studentRoll}</td><td>{formatDateTime(r.registeredAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete event?"
        message={deleting ? `"${deleting.title}" and its registrations will be deleted.` : ''}
        confirmText="Delete"
        danger
        loading={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

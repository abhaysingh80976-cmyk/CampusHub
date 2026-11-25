import { useState } from 'react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';
import { formatDateTime } from '../../utils/helpers';

export default function StudentEvents() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/events');
  const [busy, setBusy] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const register = async (e) => {
    setBusy(e.id);
    try {
      await api.post(`/events/${e.id}/register`);
      toast.success(`Registered for ${e.title}`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const cancel = async () => {
    setBusy(cancelTarget.id);
    try {
      await api.delete(`/events/${cancelTarget.id}/register`);
      toast.success('Registration cancelled');
      setCancelTarget(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <PageHeader title="College Events" subtitle="Discover and register for upcoming events" />

      {data.length === 0 ? (
        <div className="card"><EmptyState icon={CalendarDays} title="No events yet" message="Check back soon for upcoming events." /></div>
      ) : (
        <div className="item-grid">
          {data.map((e) => {
            const past = new Date(e.date) < new Date();
            return (
              <div className="card" key={e.id} style={past ? { opacity: 0.7 } : undefined}>
                <div className="between">
                  <Badge variant={past ? 'neutral' : 'info'}>{past ? 'Completed' : 'Upcoming'}</Badge>
                  {e.registered && <Badge variant="success">Registered</Badge>}
                </div>
                <h3 style={{ margin: '12px 0 6px' }}>{e.title}</h3>
                <p className="muted" style={{ fontSize: '0.9rem' }}>{e.description}</p>
                <p style={{ fontSize: '0.86rem', margin: '4px 0' }}><CalendarDays size={14} style={{ verticalAlign: '-2px' }} /> {formatDateTime(e.date)}</p>
                <p style={{ fontSize: '0.86rem', margin: '4px 0' }}><MapPin size={14} style={{ verticalAlign: '-2px' }} /> {e.venue}</p>
                <p className="muted" style={{ fontSize: '0.8rem' }}><Users size={13} style={{ verticalAlign: '-2px' }} /> {e.registrations} registered</p>
                {!past && (e.registered ? (
                  <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(e)}>Cancel registration</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => register(e)} disabled={busy === e.id}>
                    {busy === e.id ? 'Registering...' : 'Register'}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel registration?"
        message={cancelTarget ? `You will no longer be registered for ${cancelTarget.title}.` : ''}
        confirmText="Yes, cancel"
        danger
        loading={!!busy}
        onConfirm={cancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}

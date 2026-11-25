import { useState } from 'react';
import { ClipboardList, Download, Upload } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api, { getErrorMessage } from '../../services/api';
import { uploadFile, downloadFile } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import FileInput from '../../components/FileInput';
import { formatDate, formatDateTime, statusVariant, isOverdue } from '../../utils/helpers';

export default function StudentAssignments() {
  const toast = useToast();
  const asg = useFetch('/assignments');
  const subs = useFetch('/submissions/my');
  const [tab, setTab] = useState('all');
  const [target, setTarget] = useState(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  if (asg.loading || subs.loading) return <Spinner />;
  if (asg.error || subs.error) return <ErrorState message={asg.error || subs.error} onRetry={() => { asg.reload(); subs.reload(); }} />;

  const subMap = Object.fromEntries((subs.data || []).map((s) => [s.assignmentId, s]));
  const items = (asg.data || []).filter((a) => {
    if (tab === 'pending') return !subMap[a.id];
    if (tab === 'submitted') return !!subMap[a.id];
    return true;
  });

  const close = () => { setTarget(null); setFile(null); setProgress(0); };

  const submit = async () => {
    if (!file) { toast.error('Please choose a PDF file'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const up = await uploadFile('submission', file, setProgress);
      await api.post('/submissions', { assignmentId: target.id, filePath: up.id, fileName: up.name });
      toast.success('Assignment submitted successfully');
      close();
      subs.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const download = async (id, name) => {
    try { await downloadFile(id, name); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <PageHeader title="Assignments" subtitle="View, download and submit your assignments" />

      <div className="tabs">
        {['all', 'pending', 'submitted'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No assignments" message="Nothing to show in this view." /></div>
      ) : (
        <div className="item-grid">
          {items.map((a) => {
            const sub = subMap[a.id];
            const late = !sub && isOverdue(a.dueDate);
            return (
              <div className="card" key={a.id}>
                <div className="between">
                  <Badge variant="info">{a.subjectName}</Badge>
                  {sub ? <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge> : <Badge variant={late ? 'danger' : 'warning'}>{late ? 'Overdue' : 'Pending'}</Badge>}
                </div>
                <h3 style={{ margin: '12px 0 6px' }}>{a.title}</h3>
                <p className="muted" style={{ fontSize: '0.9rem' }}>{a.description}</p>
                <p style={{ fontSize: '0.85rem' }}>Due: <strong>{formatDateTime(a.dueDate)}</strong></p>
                {sub && (
                  <div className="notice-box" style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
                    Submitted on {formatDate(sub.submittedAt)}<br />
                    {sub.remarks && <>Remarks: {sub.remarks}<br /></>}
                    <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => download(sub.filePath, sub.fileName)}>
                      <Download size={14} /> My file
                    </button>
                  </div>
                )}
                <div className="row-gap">
                  {a.attachmentPath && (
                    <button className="btn btn-outline btn-sm" onClick={() => download(a.attachmentPath, `${a.title}`)}>
                      <Download size={14} /> Attachment
                    </button>
                  )}
                  {sub?.status !== 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setTarget(a)}>
                      <Upload size={14} /> {sub ? 'Re-submit' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!target}
        title={target ? `Submit: ${target.title}` : ''}
        onClose={uploading ? () => {} : close}
        footer={
          <>
            <button className="btn btn-outline" onClick={close} disabled={uploading}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={uploading}>{uploading ? `Uploading ${progress}%` : 'Submit'}</button>
          </>
        }
      >
        <FileInput label="Your submission (PDF)" kind="pdf" file={file} onChange={setFile} required />
        {uploading && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
      </Modal>
    </>
  );
}

import { useState } from 'react';
import { BookOpen, Download, FileText, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import api, { getErrorMessage } from '../../services/api';
import { downloadFile } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';
import { formatDate } from '../../utils/helpers';

export default function AdminMaterials() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const subjects = useFetch('/subjects');
  const { data, loading, error, reload } = useFetch('/materials', { q: dq, subjectId, page, limit: 9 });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

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
      <PageHeader title="Study Materials" subtitle="Review uploads and remove inappropriate or unauthorized files" />

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search materials..." />
        <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPage(1); }}>
          <option value="">All subjects</option>
          {(subjects.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.data.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="No materials" message="No uploads match your filters." /></div>
      ) : (
        <>
          <div className="item-grid">
            {data.data.map((m) => (
              <div className="card" key={m.id}>
                <div className="between"><Badge variant="info">{m.subjectName}</Badge><small className="muted">Sem {m.semester}</small></div>
                <h3 style={{ margin: '12px 0 6px' }}><FileText size={18} style={{ verticalAlign: '-3px' }} /> {m.title}</h3>
                {m.description && <p className="muted" style={{ fontSize: '0.9rem' }}>{m.description}</p>}
                <p className="muted" style={{ fontSize: '0.8rem' }}>By {m.uploaderName} · {formatDate(m.createdAt)}</p>
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

      <ConfirmDialog
        open={!!deleting}
        title="Delete material?"
        message={deleting ? `"${deleting.title}" uploaded by ${deleting.uploaderName} will be permanently deleted.` : ''}
        confirmText="Delete"
        danger
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

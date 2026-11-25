import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Badge from '../../components/Badge';
import { NOTICE_CATEGORIES, categoryVariant, formatDateTime } from '../../utils/helpers';

export default function StudentNotices() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/notices', { category, page, limit: 8 });

  return (
    <>
      <PageHeader title="Notice Board" subtitle="Exam, holiday and important announcements" />

      <div className="tabs">
        <button className={`tab ${category === '' ? 'active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>All</button>
        {NOTICE_CATEGORIES.map((c) => (
          <button key={c.value} className={`tab ${category === c.value ? 'active' : ''}`} onClick={() => { setCategory(c.value); setPage(1); }}>{c.label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.data.length === 0 ? (
        <div className="card"><EmptyState icon={Megaphone} title="No notices" message="There are no notices in this category." /></div>
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
                <small className="muted">Posted by {n.createdByName} · {formatDateTime(n.createdAt)}</small>
              </div>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}

export default function StatCard({ icon: Icon, label, value, color = 'indigo', hint }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon stat-${color}`}><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

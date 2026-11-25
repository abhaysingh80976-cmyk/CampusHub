export default function Spinner({ fullPage = false, label = 'Loading...' }) {
  const inner = (
    <div className="center-box">
      <div className="spinner" role="status" aria-label={label} />
      <p className="muted">{label}</p>
    </div>
  );
  return fullPage ? <div className="fullpage">{inner}</div> : inner;
}

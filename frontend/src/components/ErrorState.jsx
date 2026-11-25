import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-state">
      <AlertTriangle size={32} />
      <h3>Oops!</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  );
}

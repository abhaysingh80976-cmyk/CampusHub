import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={32} /></div>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}

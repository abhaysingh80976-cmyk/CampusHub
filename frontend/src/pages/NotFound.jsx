import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="fullpage">
      <div className="center-box">
        <h1 style={{ fontSize: '5rem', margin: 0 }} className="gradient-text">404</h1>
        <h2>Page not found</h2>
        <p className="muted">The page you are looking for does not exist or was moved.</p>
        <Link to="/" className="btn btn-primary"><Home size={18} /> Back to home</Link>
      </div>
    </div>
  );
}
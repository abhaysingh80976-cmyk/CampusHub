import { Navigate, useLocation } from 'react-router-dom';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import { roleHome } from '../utils/helpers';

function PendingApproval() {
  const { profile, logout, refreshProfile } = useAuth();
  const toast = useToast();

  const check = async () => {
    try {
      const p = await refreshProfile();
      if (p.status === 'active') toast.success('Your account is approved. Welcome!');
      else toast.info('Still waiting for admin approval');
    } catch {
      toast.error('Could not check status. Try again.');
    }
  };

  return (
    <div className="fullpage">
      <div className="card pending-card">
        <div className="pending-icon"><Clock size={36} /></div>
        <h2>Approval Pending</h2>
        <p className="muted">
          Hi {profile.name}, your teacher account has been created and is waiting for admin approval.
          You will get access to the teacher dashboard once an admin approves it.
        </p>
        <div className="row-gap center">
          <button className="btn btn-primary" onClick={check}><RefreshCw size={16} /> Check status</button>
          <button className="btn btn-outline" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ roles, children }) {
  const { firebaseUser, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullPage />;
  if (!firebaseUser || !profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(profile.role)) return <Navigate to={roleHome[profile.role]} replace />;
  if (profile.role === 'teacher' && profile.status === 'pending') return <PendingApproval />;
  return children;
}

// Login/Register pages: already logged-in user ko uske dashboard par bhej do
export function GuestRoute({ children }) {
  const { firebaseUser, profile, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (firebaseUser && profile) return <Navigate to={roleHome[profile.role]} replace />;
  return children;
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, Send } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail } from '../utils/validators';
import { authErrorMessage } from '../utils/helpers';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!isEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we will send you a reset link"
      footer={<Link to="/login">Back to login</Link>}
    >
      {sent ? (
        <div className="card" style={{ marginTop: 22, textAlign: 'center' }}>
          <div className="pending-icon" style={{ background: 'rgba(22,163,74,0.14)', color: 'var(--success)' }}>
            <MailCheck size={34} />
          </div>
          <h3>Check your inbox</h3>
          <p className="muted">
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            Also check your spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate style={{ marginTop: 22 }}>
          <div className="field">
            <label>Email</label>
            <input type="email" className={error ? 'input-error' : ''} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            {error && <p className="field-error">{error}</p>}
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            <Send size={18} /> {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
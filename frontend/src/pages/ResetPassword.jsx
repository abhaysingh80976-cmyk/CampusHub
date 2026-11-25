import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validatePassword } from '../utils/validators';
import { authErrorMessage } from '../utils/helpers';

export default function ResetPassword() {
  const { verifyResetCode, confirmReset } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get('oobCode');

  const [status, setStatus] = useState('checking'); // checking | ready | invalid
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      setStatus('invalid');
      return;
    }
    verifyResetCode(code)
      .then((mail) => { setEmail(mail); setStatus('ready'); })
      .catch(() => setStatus('invalid'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    const pw = validatePassword(password);
    if (pw) e.password = pw;
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await confirmReset(code, password);
      toast.success('Password updated. Please login.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={status === 'ready' ? `Set a new password for ${email}` : 'Create a new password'}
      footer={<Link to="/login">Back to login</Link>}
    >
      {status === 'checking' && <Spinner label="Checking reset link..." />}

      {status === 'invalid' && (
        <div className="notice-box" style={{ marginTop: 22 }}>
          This reset link is invalid or has expired. <Link to="/forgot-password">Request a new one</Link>.
        </div>
      )}

      {status === 'ready' && (
        <form onSubmit={submit} noValidate style={{ marginTop: 22 }}>
          <div className="field">
            <label>New password</label>
            <input type="password" className={errors.password ? 'input-error' : ''} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, letters + numbers" autoComplete="new-password" />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" className={errors.confirm ? 'input-error' : ''} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
            {errors.confirm && <p className="field-error">{errors.confirm}</p>}
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            <KeyRound size={18} /> {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
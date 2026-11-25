import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail, required } from '../utils/validators';
import { authErrorMessage, roleHome } from '../utils/helpers';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!isEmail(form.email)) e.email = 'Enter a valid email address';
    const p = required(form.password, 'Password');
    if (p) e.password = p;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const profile = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${profile.name}!`);
      const from = location.state?.from?.pathname;
      const home = roleHome[profile.role];
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Login to your CampusHub account"
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate style={{ marginTop: 22 }}>
        <div className="field">
          <label>Email</label>
          <input type="email" className={errors.email ? 'input-error' : ''} value={form.email} onChange={set('email')} placeholder="you@college.edu" autoComplete="email" />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="field">
          <label>Password</label>
          <div className="input-wrap">
            <input type={show ? 'text' : 'password'} className={errors.password ? 'input-error' : ''} value={form.password} onChange={set('password')} placeholder="Your password" autoComplete="current-password" />
            <button type="button" className="btn-icon input-toggle" onClick={() => setShow(!show)} aria-label="Show or hide password">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          <LogIn size={18} /> {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </AuthShell>
  );
}
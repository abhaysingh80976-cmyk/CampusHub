import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail, required, validatePassword } from '../utils/validators';
import { authErrorMessage, roleHome, DEPARTMENTS, SEMESTERS } from '../utils/helpers';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState(params.get('role') === 'teacher' ? 'teacher' : 'student');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', department: '', semester: '', studentId: '',
  });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!isEmail(form.email)) e.email = 'Enter a valid email address';
    const pw = validatePassword(form.password);
    if (pw) e.password = pw;
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    const dep = required(form.department, 'Department');
    if (dep) e.department = dep;
    if (role === 'student') {
      if (!form.semester) e.semester = 'Select your semester';
      if (!form.studentId.trim()) e.studentId = 'Student ID is required';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role,
        department: form.department,
        semester: role === 'student' ? Number(form.semester) : undefined,
        studentId: role === 'student' ? form.studentId.trim() : undefined,
      });
      toast.success(role === 'teacher' ? 'Account created. Waiting for admin approval.' : 'Account created. Welcome to CampusHub!');
      navigate(roleHome[data.role], { replace: true });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join CampusHub as a student or teacher"
      footer={<>Already have an account? <Link to="/login">Login</Link></>}
    >
      <div className="role-switch" style={{ marginTop: 22 }}>
        <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>Student</button>
        <button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')}>Teacher</button>
      </div>

      {role === 'teacher' && (
        <div className="notice-box">Teacher accounts need admin approval before you can access the teacher dashboard.</div>
      )}

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label>Full name <span className="req">*</span></label>
          <input className={errors.name ? 'input-error' : ''} value={form.name} onChange={set('name')} placeholder="Your full name" />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="field">
          <label>Email <span className="req">*</span></label>
          <input type="email" className={errors.email ? 'input-error' : ''} value={form.email} onChange={set('email')} placeholder="you@college.edu" autoComplete="email" />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Department <span className="req">*</span></label>
            <select className={errors.department ? 'input-error' : ''} value={form.department} onChange={set('department')}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="field-error">{errors.department}</p>}
          </div>

          {role === 'student' && (
            <div className="field">
              <label>Semester <span className="req">*</span></label>
              <select className={errors.semester ? 'input-error' : ''} value={form.semester} onChange={set('semester')}>
                <option value="">Select semester</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              {errors.semester && <p className="field-error">{errors.semester}</p>}
            </div>
          )}
        </div>

        {role === 'student' && (
          <div className="field">
            <label>Student ID <span className="req">*</span></label>
            <input className={errors.studentId ? 'input-error' : ''} value={form.studentId} onChange={set('studentId')} placeholder="e.g. CSE2201" />
            {errors.studentId && <p className="field-error">{errors.studentId}</p>}
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label>Password <span className="req">*</span></label>
            <div className="input-wrap">
              <input type={show ? 'text' : 'password'} className={errors.password ? 'input-error' : ''} value={form.password} onChange={set('password')} placeholder="Min 8 chars, letters + numbers" autoComplete="new-password" />
              <button type="button" className="btn-icon input-toggle" onClick={() => setShow(!show)} aria-label="Show or hide password">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div className="field">
            <label>Confirm password <span className="req">*</span></label>
            <input type={show ? 'text' : 'password'} className={errors.confirm ? 'input-error' : ''} value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" autoComplete="new-password" />
            {errors.confirm && <p className="field-error">{errors.confirm}</p>}
          </div>
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          <UserPlus size={18} /> {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
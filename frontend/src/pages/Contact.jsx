import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { isEmail, required } from '../utils/validators';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    const name = required(form.name, 'Name');
    if (name) e.name = name;
    if (!isEmail(form.email)) e.email = 'Enter a valid email address';
    const subject = required(form.subject, 'Subject');
    if (subject) e.subject = subject;
    if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSending(true);
    // Demo form: yahan koi email server nahi hai, isliye sirf confirmation dikhate hain
    setTimeout(() => {
      setSending(false);
      setForm(EMPTY);
      toast.success('Thank you! Your message has been received.');
    }, 700);
  };

  return (
    <>
      <section className="page-hero container">
        <h1>Contact <span className="gradient-text">Us</span></h1>
        <p className="muted">Questions or feedback? Send us a message.</p>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container contact-grid">
          <form className="card" onSubmit={submit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label>Your name <span className="req">*</span></label>
                <input className={errors.name ? 'input-error' : ''} value={form.name} onChange={set('name')} placeholder="Abhay Singh" />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="field">
                <label>Email <span className="req">*</span></label>
                <input type="email" className={errors.email ? 'input-error' : ''} value={form.email} onChange={set('email')} placeholder="you@example.com" />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>
            </div>
            <div className="field">
              <label>Subject <span className="req">*</span></label>
              <input className={errors.subject ? 'input-error' : ''} value={form.subject} onChange={set('subject')} placeholder="How can we help?" />
              {errors.subject && <p className="field-error">{errors.subject}</p>}
            </div>
            <div className="field">
              <label>Message <span className="req">*</span></label>
              <textarea className={errors.message ? 'input-error' : ''} value={form.message} onChange={set('message')} placeholder="Write your message..." />
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>
            <button className="btn btn-primary" disabled={sending}>
              <Send size={16} /> {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>

          <div className="card">
            <h3>College Information</h3>
            <p className="muted">Sample details, replace with your college's real information.</p>
            <div className="contact-info-item">
              <div className="stat-icon stat-indigo"><MapPin size={20} /></div>
              <div><strong>Address</strong><br /><span className="muted">R.R. Institute of Modern Technology, Lucknow, Uttar Pradesh</span></div>
            </div>
            <div className="contact-info-item">
              <div className="stat-icon stat-purple"><Phone size={20} /></div>
              <div><strong>Phone</strong><br /><span className="muted">+91 00000 00000</span></div>
            </div>
            <div className="contact-info-item">
              <div className="stat-icon stat-green"><Mail size={20} /></div>
              <div><strong>Email</strong><br /><span className="muted">info@campushub.example</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
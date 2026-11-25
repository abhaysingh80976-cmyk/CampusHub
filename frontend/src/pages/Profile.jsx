import { useRef, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { compressImage, validateFile } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { statusVariant, formatDate } from '../utils/helpers';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [name, setName] = useState(profile.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const saveName = async (ev) => {
    ev.preventDefault();
    if (name.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
    setError('');
    setSaving(true);
    try {
      await api.patch('/users/me', { name: name.trim() });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePhoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const problem = validateFile(f, 'image');
    if (problem) { toast.error(problem); return; }
    setUploading(true);
    try {
      const photoURL = await compressImage(f);
      await api.patch('/users/me', { photoURL });
      await refreshProfile();
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const rows = [
    ['Email', profile.email],
    ['Role', <span style={{ textTransform: 'capitalize' }}>{profile.role}</span>],
    ['Department', profile.department],
    ...(profile.role === 'student' ? [['Student ID', profile.studentId], ['Semester', profile.semester]] : []),
    ['Status', <Badge variant={statusVariant(profile.status)}>{profile.status}</Badge>],
    ['Member since', formatDate(profile.createdAt)],
  ];

  return (
    <>
      <PageHeader title="My Profile" subtitle="View and edit your account details" />

      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: 12 }}>
            <Avatar src={profile.photoURL} name={profile.name} size={110} />
            <button
              className="btn btn-primary btn-sm"
              style={{ position: 'absolute', right: -6, bottom: 0, borderRadius: 999, padding: 8 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change photo"
            >
              <Camera size={16} />
            </button>
            <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={changePhoto} />
          </div>
          <h2 style={{ marginBottom: 2 }}>{profile.name}</h2>
          <p className="muted">{uploading ? 'Uploading photo...' : profile.email}</p>
          <div className="list" style={{ textAlign: 'left', marginTop: 10 }}>
            {rows.map(([k, v]) => (
              <div className="list-item" key={k}><span className="muted">{k}</span><strong>{v}</strong></div>
            ))}
          </div>
        </div>

        <form className="card" onSubmit={saveName} noValidate>
          <h3>Edit profile</h3>
          <div className="field">
            <label>Full name</label>
            <input className={error ? 'input-error' : ''} value={name} onChange={(e) => setName(e.target.value)} />
            {error && <p className="field-error">{error}</p>}
          </div>
          <div className="field">
            <label>Email</label>
            <input value={profile.email} disabled />
          </div>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Department, semester and Student ID can only be changed by an administrator.
          </p>
          <button className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </>
  );
}

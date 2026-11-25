import { getErrorMessage } from '../services/api';

export const DEPARTMENTS = ['CSE', 'CSE (AI & ML)', 'IT', 'ECE', 'ME', 'CE', 'B.Com', 'BBA', 'BCA'];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
export const NOTICE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'exam', label: 'Exam' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'important', label: 'Important' },
];

export const roleHome = { student: '/student', teacher: '/teacher', admin: '/admin' };

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day(s) ago`;
  return formatDate(iso);
};

export const isOverdue = (iso) => iso && new Date(iso) < new Date();

// datetime-local input ke liye ISO -> "YYYY-MM-DDTHH:mm"
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('') || 'U';

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const statusVariant = (status) =>
  ({
    active: 'success', accepted: 'success', present: 'success', submitted: 'info', reviewed: 'info',
    pending: 'warning', late: 'warning', inactive: 'danger', rejected: 'danger', absent: 'danger',
  }[status] || 'neutral');

export const categoryVariant = (c) => ({ exam: 'danger', holiday: 'success', important: 'warning', general: 'info' }[c] || 'neutral');

export const authErrorMessage = (err) => {
  const map = {
    'auth/invalid-credential': 'Incorrect email or password',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password is too weak (minimum 6 characters)',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/user-disabled': 'This account has been disabled',
    'auth/network-request-failed': 'Network error. Check your internet connection',
    'auth/expired-action-code': 'This reset link has expired. Request a new one',
    'auth/invalid-action-code': 'This reset link is invalid or already used',
  };
  return map[err?.code] || getErrorMessage(err);
};

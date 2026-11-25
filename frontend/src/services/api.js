import axios from 'axios';
import { auth } from '../firebase/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Har request me fresh Firebase ID token attach hota hai
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (err) => {
  const data = err?.response?.data;
  if (data?.errors?.length) return data.errors.join(', ');
  if (data?.message) return data.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach server. Is the backend running?';
  return err?.message || 'Something went wrong';
};

export default api;

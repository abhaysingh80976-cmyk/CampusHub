import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // login/register ke dauran onAuthStateChanged ko skip karte hain (race condition se bachne ke liye)
  const busy = useRef(false);

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    return data;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (busy.current) return;
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        setProfile(await fetchProfile());
      } catch (err) {
        setProfile(null);
        const status = err?.response?.status;
        if (status === 401 || status === 403) await signOut(auth); // deactivated / profile missing
      }
      setLoading(false);
    });
    return unsub;
  }, [fetchProfile]);

  const login = async (email, password) => {
    busy.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let p;
      try {
        p = await fetchProfile();
      } catch (err) {
        await signOut(auth);
        throw err;
      }
      setFirebaseUser(cred.user);
      setProfile(p);
      return p;
    } finally {
      busy.current = false;
    }
  };

  const register = async ({ email, password, ...profileData }) => {
    busy.current = true;
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email, password);
      const { data } = await api.post('/auth/register', profileData);
      setFirebaseUser(cred.user);
      setProfile(data);
      return data;
    } catch (err) {
      // Profile create nahi hua to Firebase user hata do taaki dobara register kar sake
      if (cred?.user) {
        try { await cred.user.delete(); } catch { /* ignore */ }
      }
      throw err;
    } finally {
      busy.current = false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setFirebaseUser(null);
  };

  const refreshProfile = async () => {
    const p = await fetchProfile();
    setProfile(p);
    return p;
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const verifyResetCode = (code) => verifyPasswordResetCode(auth, code);
  const confirmReset = (code, newPassword) => confirmPasswordReset(auth, code, newPassword);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser, profile, loading, login, register, logout,
        refreshProfile, resetPassword, verifyResetCode, confirmReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

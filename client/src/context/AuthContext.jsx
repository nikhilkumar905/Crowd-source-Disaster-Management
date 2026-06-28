/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(storage.getToken());
  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storage.setToken(token);
  }, [token]);

  useEffect(() => {
    storage.setUser(user);
  }, [user]);

  useEffect(() => {
    if (user?.id && user?.role && token) {
      connectSocket({ userId: user.id, role: user.role });
    } else {
      disconnectSocket();
    }
  }, [user, token]);

  const auth = useMemo(
    () => ({
      token,
      user,
      loading,
      setUser,
      async login({ email, password }) {
        setLoading(true);
        try {
          const { data } = await api.post('/auth/login', { email, password });
          setToken(data.token);
          setUser(data.user);
          toast.success('Logged in');
          return data.user;
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Login failed');
          throw err;
        } finally {
          setLoading(false);
        }
      },
      async register({ name, email, password, role }) {
        setLoading(true);
        try {
          const { data } = await api.post('/auth/register', { name, email, password, role });
          setToken(data.token);
          setUser(data.user);
          toast.success('Account created');
          return data.user;
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Registration failed');
          throw err;
        } finally {
          setLoading(false);
        }
      },
      logout() {
        setToken(null);
        setUser(null);
        storage.clearAuth();
        disconnectSocket();
        toast.success('Logged out');
      }
    }),
    [token, user, loading, setUser]
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('orbem_user') || 'null');
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('orbem_token');
}

function persistSession(payload) {
  localStorage.setItem('orbem_token', payload.token);
  localStorage.setItem('orbem_user', JSON.stringify(payload.user));
}

export function clearSession() {
  localStorage.removeItem('orbem_token');
  localStorage.removeItem('orbem_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    let mounted = true;
    async function refreshUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (mounted) {
          setUser(response.data.user);
          localStorage.setItem('orbem_user', JSON.stringify(response.data.user));
        }
      } catch {
        clearSession();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    refreshUser();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials);
    persistSession(response.data);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(payload) {
    const response = await api.post('/auth/register', payload);
    persistSession(response.data);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  function updateUser(nextUser) {
    if (!nextUser) return;
    setUser(nextUser);
    localStorage.setItem('orbem_user', JSON.stringify(nextUser));
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      updateUser,
      logout,
      isAuthenticated: Boolean(user && getToken())
    }),
    [user, loading]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

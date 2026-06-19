import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import api, { AUTH_SESSION_INVALIDATED_EVENT } from './api';

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
  if (!payload?.token || !payload?.user) {
    throw new Error('The server returned an invalid authentication response.');
  }

  localStorage.setItem('orbem_token', payload.token);
  localStorage.setItem('orbem_user', JSON.stringify(payload.user));
}

export function clearSession() {
  localStorage.removeItem('orbem_token');
  localStorage.removeItem('orbem_user');
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken);
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let mounted = true;

    function endSession() {
      clearSession();
      if (!mounted) return;
      setToken(null);
      setUser(null);
      setLoading(false);
    }

    function syncSessionFromStorage(event) {
      if (event.key && !['orbem_token', 'orbem_user'].includes(event.key)) return;

      const nextToken = getToken();
      setToken(nextToken);
      setUser(nextToken ? getStoredUser() : null);
      setLoading(false);
    }

    window.addEventListener(AUTH_SESSION_INVALIDATED_EVENT, endSession);
    window.addEventListener('storage', syncSessionFromStorage);

    async function refreshUser() {
      if (!getToken()) {
        clearSession();
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        if (mounted) {
          setToken(getToken());
          setUser(response.data.user);
          localStorage.setItem('orbem_user', JSON.stringify(response.data.user));
        }
      } catch {
        endSession();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refreshUser();

    return () => {
      mounted = false;
      window.removeEventListener(AUTH_SESSION_INVALIDATED_EVENT, endSession);
      window.removeEventListener('storage', syncSessionFromStorage);
    };
  }, []);

  async function login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    persistSession(response.data);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(payload) {
    const response = await api.post('/api/auth/register', payload);
    persistSession(response.data);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    clearSession();
    setToken(null);
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
      isAuthenticated: Boolean(user && token)
    }),
    [user, token, loading]
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

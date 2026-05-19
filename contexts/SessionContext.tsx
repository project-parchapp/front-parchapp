import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/lib/api/client';

const TOKEN_KEY = 'parchapp_token';
const USER_KEY = 'parchapp_user_json';

// Web-compatible storage helpers
const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};
const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
};
const removeItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
};

export type SessionUser = {
  id: string;
  email: string;
  display_name: string;
  role: string;
};

type SessionContextValue = {
  ready: boolean;
  token: string | null;
  user: SessionUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [t, u] = await Promise.all([
          getItem(TOKEN_KEY),
          getItem(USER_KEY),
        ]);
        if (cancelled) return;
        setToken(t);
        setUser(u ? (JSON.parse(u) as SessionUser) : null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      json: { email, password },
    });
    await setItem(TOKEN_KEY, res.token);
    await setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, token, user, signIn, signOut }),
    [ready, token, user, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return ctx;
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

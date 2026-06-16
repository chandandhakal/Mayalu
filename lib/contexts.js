'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getTheme } from './theme';
import { t as translate, locales } from './i18n';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('app-locale') || 'en';
    return 'en';
  });
  const [themeMode, setThemeModeState] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('app-theme') || 'dark';
    return 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('app-locale', locale); } catch {}
  }, [locale]);
  useEffect(() => {
    try { localStorage.setItem('app-theme', themeMode); } catch {}
  }, [themeMode]);

  const theme = getTheme(themeMode);
  const T = useCallback(k => translate(locale, k), [locale]);
  const setLocale = useCallback((l) => setLocaleState(l), []);
  const setThemeMode = useCallback((m) => setThemeModeState(m), []);

  return (
    <AppContext.Provider value={{ theme, themeMode, setThemeMode, locale, setLocale, T, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

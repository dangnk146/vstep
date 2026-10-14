'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  isHydrated: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_CHANGE_EVENT = 'vstep:theme-change';

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = window.localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const resolvedTheme = getPreferredTheme();
    setTheme(resolvedTheme);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = () => {
      const nextTheme = getPreferredTheme();
      setTheme(nextTheme);
    };

    const handleThemeEvent = () => {
      const nextTheme = getPreferredTheme();
      setTheme(nextTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeEvent);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    window.localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <ThemeContext.Provider value={{ theme, isHydrated, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

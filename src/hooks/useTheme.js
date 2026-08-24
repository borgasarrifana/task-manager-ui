import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'theme-preference';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredOverride() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

/**
 * Returns { theme, toggleTheme }.
 * - On first load, follows the OS/browser preference (no override stored).
 * - Once the user calls toggleTheme, that choice is saved and takes
 *   priority over the system setting until they toggle back to "system".
 */
export function useTheme() {
  const [override, setOverride] = useState(getStoredOverride);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Keep in sync if the OS theme changes while the tab is open
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => setSystemTheme(e.matches ? 'light' : 'dark');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const theme = override ?? systemTheme;

  // Reflect the current theme onto <html data-theme="...">
  useEffect(() => {
    if (override) {
      document.documentElement.setAttribute('data-theme', override);
      localStorage.setItem(STORAGE_KEY, override);
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [override]);

  const toggleTheme = useCallback(() => {
    setOverride((theme === 'light') ? 'dark' : 'light');
  }, [theme]);

  return { theme, toggleTheme };
}
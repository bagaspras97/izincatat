'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 flex items-center justify-center rounded-xl border border-border-card text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-all ${className}`}
      title={theme === 'light' ? 'Aktifkan dark mode' : 'Aktifkan light mode'}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

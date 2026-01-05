/**
 * @file ThemeContext.tsx
 * @description Fixed: Added isDark helper for logic consistency.
 */
import React, { createContext, useContext, useState } from 'react';
import { theme as defaultTheme, Theme } from '../styles/theme';

interface ThemeContextType {
  theme: Theme;
  colors: Theme['colors'];
  mode: 'dark' | 'light';
  isDark: boolean; // ADDED THIS
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider
      value={{
        theme: defaultTheme,
        colors: defaultTheme.colors,
        mode,
        isDark: mode === 'dark', // ADDED THIS
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

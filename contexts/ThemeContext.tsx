import React, { createContext, useContext, ReactNode } from 'react';

// This matches the design you want
export const theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#334155',
  },
};

type ThemeContextType = typeof theme;

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

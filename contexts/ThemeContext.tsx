/**
 * @file ThemeContext.tsx
 * @description Master AAA+ Tier Theme Engine.
 * * ARCHITECTURAL MODULES:
 * 1. DYNAMIC PALETTE ENGINE: Swaps hex-codes based on 'dark' | 'light' state.
 * 2. SYSTEM OVERRIDE: Detects hardware appearance preferences but allows manual toggle.
 * 3. TYPE-SAFE COLOR TOKENS: Ensures 100% parity with the global styling system.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// MODULE 1: DEFINE PALETTES
// High-fidelitySlate palettes designed for Pantry Pal AI
const palettes = {
  dark: {
    primary: '#22C55E',
    background: '#0F172A',
    surface: '#1E293B',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  light: {
    primary: '#16A34A',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: 'rgba(0, 0, 0, 0.1)',
  },
};

interface ThemeContextType {
  colors: typeof palettes.dark;
  mode: 'dark' | 'light';
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<'dark' | 'light'>(
    systemScheme === 'light' ? 'light' : 'dark'
  );

  /**
   * MODULE 2: TOGGLE LOGIC
   * Description: Atomic state swap for the theme mode.
   */
  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  /**
   * MODULE 3: PERFORMANCE CACHE (useMemo)
   * Description: Prevents heavy UI re-paints by only updating the
   * color object when the mode changes.
   */
  const value = useMemo(
    () => ({
      colors: mode === 'dark' ? palettes.dark : palettes.light,
      mode,
      isDark: mode === 'dark',
      toggleTheme,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

/**
 * @file ThemeContext.tsx
 * @description Master AAA+ Tier Theme Logic Engine.
 * * ARCHITECTURAL MODULES:
 * 1. ATOMIC STATE MANAGEMENT: Tracks 'dark' | 'light' modes with hardware parity.
 * 2. DEPTH ORCHESTRATION: Injects the 'shadows' engine into the global context.
 * 3. PERFORMANCE HYDRATION: Memoizes theme values to ensure 60FPS palette swaps.
 * 4. TYPE-SAFE CONSUMPTION: Provides strict TypeScript interfaces for color/shadow tokens.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// External Design Tokens
import { palettes, shadows } from '../styles/theme';

/**
 * MODULE 1: TYPE DEFINITIONS
 * Description: Ensures 100% parity between theme tokens and UI implementation.
 */
interface ThemeContextType {
  colors: typeof palettes.dark;
  shadows: typeof shadows;
  mode: 'dark' | 'light';
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();

  /**
   * MODULE 2: ATOMIC STATE INITIALIZATION
   * Description: Synchronizes initial state with native OS appearance settings.
   */
  const [mode, setMode] = useState<'dark' | 'light'>(
    systemScheme === 'light' ? 'light' : 'dark'
  );

  /**
   * MODULE 3: THEME TRANSITION ENGINE
   * Description: Atomic swap for the appearance mode.
   * Planned: Can be linked to Haptics in Step 3 (Settings UI).
   */
  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  /**
   * MODULE 4: CONTEXT VALUE OPTIMIZATION (useMemo)
   * Description: Maps exported tokens from 'theme.ts' to the active state.
   * Implementation: Prevents unecessary re-renders in the Global Provider tree.
   */
  const value = useMemo(
    () => ({
      colors: mode === 'dark' ? palettes.dark : palettes.light,
      shadows, // Injects shadow engine for layered depth
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

/**
 * MODULE 5: CUSTOM HOOK INTERFACE
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      'AAA+ Exception: useTheme must be used within ThemeProvider'
    );
  }
  return context;
};

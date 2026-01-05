/**
 * @file theme.ts
 * @description Master design system for Pantry Pal.
 * Features high-end glassmorphism presets and a modern slate-green palette.
 */

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface GlassTheme {
  intensity: number;
  borderColor: string;
  backgroundColor: string;
}

export interface Theme {
  colors: ThemeColors;
  glass: GlassTheme;
}

const _theme: Theme = {
  colors: {
    primary: '#22C55E', // Green primary
    background: '#0F172A', // Dark slate background
    surface: '#1E293B', // Slate surface
    success: '#22C55E', // Emerald success
    warning: '#F59E0B', // Amber warning
    error: '#EF4444', // Red error
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  glass: {
    intensity: 20,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
};

export const theme = Object.freeze(_theme);
export type AppTheme = typeof _theme;

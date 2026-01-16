/**
 * @file theme.ts
 * @description Master AAA+ Tier Design System.
 * OVERHAULED: High-intensity shadow engine for maximum visibility in Light Mode.
 */

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  card: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  glass: {
    background: string;
    intensity: number;
    borderColor: string;
  };
}

export const palettes = {
  dark: {
    primary: '#22C55E',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '#000000',
    glass: {
      background: 'rgba(30, 41, 59, 0.7)',
      intensity: 80,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  light: {
    primary: '#16A34A',
    background: '#F8FAFC', // Slightly off-white to make pure white cards pop
    surface: '#FFFFFF',
    card: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#0F172A', // High contrast Slate-900
    textSecondary: '#475569',
    border: 'rgba(15, 23, 42, 0.12)',
    shadow: '#0F172A', // Deep Slate for crisp shadow definitions
    glass: {
      background: 'rgba(255, 255, 255, 0.9)',
      intensity: 90,
      borderColor: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

export const shadows = {
  small: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  medium: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, // Significantly higher for "Bento" look
    shadowRadius: 30,
    elevation: 10,
  },
  large: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
    elevation: 16,
  },
};
/**
 * @file theme.ts
 * @description Master AAA+ Tier Design System.
 * Updated: High-fidelity Glassmorphism & Gradient Engine for Light Mode.
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
    background: '#0F172A', // Slate-950
    surface: '#1E293B', // Slate-800
    card: '#334155', // Slate-700
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '#000000',
    // AAA+ Glassmorphism
    glass: {
      background: 'rgba(30, 41, 59, 0.7)',
      intensity: 80,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  light: {
    primary: '#16A34A',
    background: '#F8FAFC', // Professional Off-White (Slate-50)
    surface: '#FFFFFF', // Pure White Surfaces (Elevates against background)
    card: '#F1F5F9', // Nested Card Depth (Slate-100)
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#0F172A', // Deep Contrast (Slate-900)
    textSecondary: '#64748B', // Muted Meta (Slate-500)
    border: 'rgba(15, 23, 42, 0.06)', // Ultra-subtle border
    shadow: '#312E81', // Indigo-tinted shadow for professional depth
    // AAA+ Glassmorphism (High Intensity for Light Mode)
    glass: {
      background: 'rgba(255, 255, 255, 0.85)',
      intensity: 95,
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
  },
};

export const gradients = {
  primary: ['#16A34A', '#22C55E'],
  accent: ['#6366F1', '#8B5CF6'], // Indigo-Violet hybrid
  glass: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)'],
};

export const shadows = {
  small: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, // Increased for better Light Mode depth
    shadowRadius: 24,
    elevation: 8,
  },
  large: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
};

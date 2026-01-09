/**
 * @file theme.ts
 * @description Master AAA+ Tier Design System.
 * * ARCHITECTURAL MODULES:
 * 1. LAYERED DEPTH PALETTES: Utilizes Slate-50 foundations for elevated light-mode pop.
 * 2. PREMIUM COLOR TOKENS: Professional indigo-slate hybrids for high-contrast legibility.
 * 3. SOFT-DEPTH SHADOW ENGINE: Uses indigo-tinted opacity for expensive-feeling UI depth.
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
}

// MODULE 1: EXPORTED PALETTES
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
  },
};

// MODULE 2: EXPORTED SHADOW ENGINE
// Designed to create the "Floating Bento" effect in light mode.
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
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  large: {
    shadowColor: palettes.light.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 12,
  },
};

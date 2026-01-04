// TypeScript interfaces for type safety and better IntelliSense
export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  success: string;
  warning: string;
  error: string;
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

// Define the theme object with improved structure
const _theme: Theme = {
  // Color palette for consistent UI theming
  colors: {
    primary: '#22C55E', // Green primary color
    background: '#0F172A', // Dark slate background
    surface: '#1E293B', // Lighter surface color
    success: '#22C55E', // Same as primary for success states
    warning: '#F59E0B', // Amber for warnings
    error: '#EF4444', // Red for errors
  },
  // High-end glassmorphism presets for modern UI effects
  glass: {
    intensity: 20, // Blur intensity value
    borderColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white border
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Semi-transparent slate background
  },
};

// Freeze the theme object to prevent accidental mutations
export const theme = Object.freeze(_theme);

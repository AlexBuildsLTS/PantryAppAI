// Constants for Pantry App

export const SPACING = 16;

export const CATEGORIES = ['All', 'Produce', 'Dairy', 'Protein', 'Pantry', 'Frozen', 'Other'] as const;

export const SEARCH_DEBOUNCE_MS = 350;

export const EXPIRY_PRESETS = [
  { id: '3d', label: '3 Days', days: 3, icon: 'clock-fast' },
  { id: '1w', label: '1 Week', days: 7, icon: 'calendar-week' },
  { id: '2w', label: '2 Weeks', days: 14, icon: 'calendar-range' },
  { id: '1m', label: '1 Month', days: 30, icon: 'calendar-month' },
] as const;

export type Category = typeof CATEGORIES[number];
export type ExpiryPreset = typeof EXPIRY_PRESETS[number];
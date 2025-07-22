export * from './PantryItem';
export * from './User';
export * from './Notification';
export * from './Recipe';

// Common types used across the app
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AIDetectionResult {
  itemName: string;
  confidence: number;
  category?: string;
  suggestedLocation?: 'Pantry' | 'Fridge' | 'Freezer';
  estimatedExpiry?: number; // days from now
}

export interface NotificationSettings {
  enabled: boolean;
  expirationAlerts: boolean;
  shoppingReminders: boolean;
  weeklyReports: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  aiApiKey?: string;
  language: string;
  currency: string;
}
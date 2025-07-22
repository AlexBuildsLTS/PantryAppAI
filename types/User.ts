export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
  subscription?: UserSubscription;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  language: string;
  currency: string;
  defaultExpiryDays: number;
  aiApiKey?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  expirationAlerts: boolean;
  shoppingReminders: boolean;
  weeklyReports: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface UserSubscription {
  plan: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
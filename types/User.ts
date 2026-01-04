/**
 * @module UserTypes
 * UI-specific user models and application preferences.
 */
import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    expiryAlerts: boolean;
    recipeSuggestions: boolean;
  };
  language: string;
}

export interface AuthState {
  profile: Profile | null;
  session: any | null;
  isLoading: boolean;
}

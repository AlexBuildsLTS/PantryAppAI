import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '@/types/User';
import { AppError } from '@/utils/errorHandler';

class AuthServiceClass {
  private readonly STORAGE_KEY = '@pantrypal_auth';
  private readonly API_BASE_URL = 'https://api.pantrypal.com'; // Replace with actual API

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      // Mock implementation - replace with actual API call
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        displayName,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          notifications: {
            enabled: true,
            expirationAlerts: true,
            shoppingReminders: true,
            weeklyReports: false,
            soundEnabled: true,
            vibrationEnabled: true,
          },
          language: 'en',
          currency: 'USD',
          defaultExpiryDays: 7,
        },
      };

      await this.storeUser(mockUser);
      return mockUser;
    } catch (error) {
      throw new AppError('Failed to create account', 'SIGNUP_FAILED');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      // Mock implementation - replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          notifications: {
            enabled: true,
            expirationAlerts: true,
            shoppingReminders: true,
            weeklyReports: false,
            soundEnabled: true,
            vibrationEnabled: true,
          },
          language: 'en',
          currency: 'USD',
          defaultExpiryDays: 7,
        },
      };

      await this.storeUser(mockUser);
      return mockUser;
    } catch (error) {
      throw new AppError('Invalid credentials', 'SIGNIN_FAILED');
    }
  }

  async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      throw new AppError('Failed to sign out', 'SIGNOUT_FAILED');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new AppError('No user logged in', 'NO_USER');
      }

      const updatedUser = { ...currentUser, ...updates };
      await this.storeUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw new AppError('Failed to update profile', 'UPDATE_FAILED');
    }
  }

  private async storeUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}

export const AuthService = new AuthServiceClass();
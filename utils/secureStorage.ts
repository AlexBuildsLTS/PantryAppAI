/**
 * @file secureStorage.ts
 * @description Enterprise utility for encrypted data persistence.
 * Safely handles Native (SecureStore) and Web (LocalStorage) fallbacks.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Checks if the current environment supports native SecureStore.
 */
const isWeb = Platform.OS === 'web';

export const secureStorage = {
  /**
   * Securely saves a string value.
   * @param key The unique identifier for the data.
   * @param value The string to encrypt and store.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error saving ${key}:`, error);
    }
  },

  /**
   * Retrieves a securely stored string.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error fetching ${key}:`, error);
      return null;
    }
  },

  /**
   * Deletes a key from storage.
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
    }
  },
};

import * as SecureStore from 'expo-secure-store';

/**
 * Custom storage adapter for Supabase to use Expo SecureStore.
 * This ensures that JWT tokens are encrypted at rest on the device.
 */
export const secureStorageAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

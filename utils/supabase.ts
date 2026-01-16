/**
 * @file supabase.ts
 * @description Universal Supabase client for Pantry Pal.
 * Automatically switches between SecureStore (Native) and LocalStorage (Web).
 */

import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

/**
 * Universal Storage Adapter.
 * Encrypts data on mobile devices and falls back to standard storage on Web
 * to prevent the 'getValueWithKeyAsync' TypeError.
 */
const UniversalStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * The core client instance.
 * persistSession: true ensures users don't have to log in every time.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: UniversalStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Centralized error utility.
 */
export const handleSupabaseError = (error: any): string => {
  const message = error?.message || 'Database connection error';
  console.error('[SUPABASE_ERROR]:', message);
  return message;
};

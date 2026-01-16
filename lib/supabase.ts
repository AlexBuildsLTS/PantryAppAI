/**
 * PROJECT CRADLE: SUPABASE MASTER ENGINE V3.0
 * Path: lib/supabase.ts
 * ----------------------------------------------------------------------------
 * OPTIMIZATIONS:
 * 1. RESILIENT STORAGE: Implements a fail-safe memory fallback for Web privacy modes.
 * 2. SCHEMA AWARENESS: Ready for Database Type injection to prevent runtime sync errors.
 * 3. SSR PROTECTION: Hardened window check to eliminate hydration mismatches.
 * 4. ADMIN HANDSHAKE: Centralized error handling for edge function invocations.
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { secureStorage } from './secureStorage';

// --- 1. CONFIGURATION GATEWAY ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// --- 2. RESILIENT STORAGE ADAPTER ---
/**
 * Logic: Web environments often block localStorage in 'Incognito' or strict privacy modes.
 * This adapter provides a memory-sync fallback to prevent the app from crashing.
 */
class WebResilientStorage {
  private memoryStorage: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      return typeof window !== 'undefined'
        ? window.localStorage.getItem(key)
        : null;
    } catch {
      return this.memoryStorage[key] || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined')
        window.localStorage.setItem(key, value);
    } catch {
      this.memoryStorage[key] = value;
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {
      delete this.memoryStorage[key];
    }
  }
}

const authStorage =
  Platform.OS === 'web' ? new WebResilientStorage() : secureStorage;

// --- 3. SINGLETON CORE INITIALIZATION ---
/**
 * Exported as a singleton to ensure zero-collision across monitoring cores.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce', // Recommended for modern secure authentication
  },
});

// --- 4. HARDENED ADMIN PROTOCOLS ---

/**
 * Standardized execution for Admin Edge Functions.
 */
async function invokeAdminFunction(name: string, payload: object) {
  const { data, error } = await supabase.functions.invoke(name, {
    body: payload,
  });

  if (error) {
    console.error(`[Supabase Engine] ${name} Handshake Failed:`, error.message);
    throw new Error(`CRITICAL_SYSTEM_ERROR: ${error.message}`);
  }
  return data;
}

export const adminActions = {
  changeRole: (userId: string, newRole: string) =>
    invokeAdminFunction('admin-change-role', { userId, newRole }),

  deactivate: (userId: string) =>
    invokeAdminFunction('admin-deactivate', { userId, deactivate: true }),

  delete: (userId: string) => invokeAdminFunction('admin-delete', { userId }),
};

/**
 * @module Types
 * Centralized Type Definition Hub for the Pantry Pal Ecosystem.
 */

// 1. Export the auto-generated Supabase schema
export * from './database.types';

// 2. Export refined UI models
export * from './User';
export * from './Recipe';
export * from './PantryItem';

// 3. System-wide utility types
export interface AIDetectionResult {
  name: string;
  confidence: number;
  expiry_days: number;
  location: 'pantry' | 'fridge' | 'freezer';
}

export type StorageLocation = 'pantry' | 'fridge' | 'freezer' | 'other';

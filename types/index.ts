/**
 * @module Types
 * Centralized Type Definition Hub for the Pantry Pal Ecosystem.
 *
 * This module serves as the central hub for all type definitions used across the Pantry Pal application,
 * ensuring type safety, consistency, and maintainability.
 */

// 1. System-wide utility types (defined first for use in interfaces)
export type StorageLocation = 'pantry' | 'fridge' | 'freezer' | 'other';

/**
 * Represents the result of AI detection for food items.
 * Provides structured data from AI analysis of pantry contents.
 */
export interface AIDetectionResult {
  /** The detected item name. */
  name: string;
  /** Confidence score of the detection (0-1, where 1 is 100% confidence). */
  confidence: number;
  /** Estimated days until the item expires (positive integer). */
  expiry_days: number;
  /** Storage location where the item was detected. */
  location: StorageLocation;
}

// 2. Export the auto-generated Supabase schema
export * from './database.types';

// 3. Export refined UI models
export * from './User';
export * from './Recipe';
export * from './PantryItem';

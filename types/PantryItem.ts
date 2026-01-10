/**
 * @file PantryItem.ts
 * @description Master AAA+ Tier Domain Types for Inventory.
 * Uses Schema-First typing to ensure 100% parity with Supabase.
 */

import { Database } from './database.types';

// 1. THE SOURCE OF TRUTH
// We extract the Row, Insert, and Update types directly from the schema.
export type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
export type CreatePantryItemDTO =
  Database['public']['Tables']['pantry_items']['Insert'];
export type UpdatePantryItemDTO =
  Database['public']['Tables']['pantry_items']['Update'];

// 2. ENUM EXTRACTION (Strict Mode)
// Instead of manual strings, we extract the exact Enums from the Database.
// This ensures that if you change an Enum in SQL, TypeScript catches it here.
export type ItemStatus = Database['public']['Enums']['item_status'];
export type ActionType = Database['public']['Enums']['action_type'];
export type StorageType = Database['public']['Enums']['storage_type'];

// 3. UI DOMAIN EXTENSIONS
// These constants power the "Sleek UI" (Pickers, Filters, and Badges).
export const PANTRY_CATEGORIES = [
  'Produce',
  'Dairy',
  'Protein',
  'Pantry',
  'Frozen',
  'Beverages',
  'Bakery',
  'Other',
] as const;

export type PantryCategory = (typeof PANTRY_CATEGORIES)[number];

export const ITEM_UNITS = [
  'pcs',
  'kg',
  'g',
  'lb',
  'oz',
  'L',
  'ml',
  'pack',
  'bottle',
  'can',
] as const;

// 4. BUSINESS LOGIC INTERFACES
// Use this for components that need "calculated" data not stored in the DB.
export interface EnhancedPantryItem extends PantryItem {
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;
  statusColor: string;
}

/**
 * MODULE 5: TYPE GUARD
 * Description: Runtime safety check to ensure data conforms to the PantryItem shape.
 */
export const isPantryItem = (item: any): item is PantryItem => {
  return item && typeof item.id === 'string' && typeof item.name === 'string';
};

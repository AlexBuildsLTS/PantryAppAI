/**
 * @file PantryItem.ts
 * @description Type definitions for the inventory system.
 * Aligned with the 'pantry_items' table in your Supabase schema.
 */

import { Database } from './database.types';

// The base object as it exists in the database
export type PantryItem = Database['public']['Tables']['pantry_items']['Row'];

/**
 * Data Transfer Object for creating a new item.
 * Omit server-managed fields to satisfy strict type checking.
 */
export type CreatePantryItemDTO =
  Database['public']['Tables']['pantry_items']['Insert'];

/**
 * Data Transfer Object for partial updates.
 */
export type UpdatePantryItemDTO =
  Database['public']['Tables']['pantry_items']['Update'];

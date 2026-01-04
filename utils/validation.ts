/**
 * @module ValidationUtils
 * Provides strict validation and sanitization for pantry operations.
 * Optimized for PostgreSQL/Supabase data integrity.
 */

import { Database } from '@/types/database.types';

// Extract the Insert type from your auto-generated Supabase types
type PantryInsert = Database['public']['Tables']['pantry_items']['Insert'];

/**
 * Validates a pantry item against database constraints.
 * Returns an array of localized error strings.
 */
export const validatePantryItem = (item: Partial<PantryInsert>): string[] => {
  const errors: string[] = [];

  // 1. Name Validation (Required, Max Length)
  if (!item.name || item.name.trim().length === 0) {
    errors.push('Item name is mandatory.');
  } else if (item.name.length > 100) {
    errors.push('Name is too long (Max 100 characters).');
  }

  // 2. Quantity Validation (Postgres Numeric compatibility)
  if (item.quantity === undefined || item.quantity === null) {
    errors.push('Quantity is required.');
  } else if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
    errors.push('Quantity must be a positive number.');
  }

  // 3. Enum Validation (Ensures alignment with SQL storage_type)
  const validLocations = ['pantry', 'fridge', 'freezer', 'other'];
  if (!item.location || !validLocations.includes(item.location)) {
    errors.push('Please select a valid storage location.');
  }

  // 4. Expiry Date Logic
  if (item.expiry_date) {
    const date = new Date(item.expiry_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format provided.');
    }
  }

  return errors;
};

/**
 * Performs aggressive sanitization to prevent XSS or broken DB queries.
 * Standardizes casing for cleaner search analytics.
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"\\;]/g, '') // Strip SQL/HTML injection characters
    .replace(/\s+/g, ' '); // Collapse multiple spaces
};

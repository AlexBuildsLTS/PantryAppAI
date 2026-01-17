/**
 * @file FoodItemRepository.ts
 * @description High-performance data access layer for pantry items.
 * Provides CRUD operations with improved error handling, validation, and maintainability.
 */

import { supabase } from '../../lib/supabase';
import {
  PantryItem,
  CreatePantryItemDTO,
  UpdatePantryItemDTO,
} from '../../types/PantryItem';

/**
 * Custom error class for repository operations.
 */
class RepositoryError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class FoodItemRepository {
  private static readonly TABLE_NAME = 'pantry_items' as const;

  /**
   * Retrieves all pantry items sorted by expiration date (ascending).
   * @returns Promise resolving to an array of PantryItem objects.
   * @throws RepositoryError if the query fails.
   */
  static async getAllItems(): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) {
        console.error('Error fetching all items:', error);
        throw new RepositoryError(`Failed to fetch items: ${error.message}`, error.code);
      }
      return data || [];
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      console.error('Unexpected error in getAllItems:', error);
      throw new RepositoryError('Unexpected error occurred while fetching items');
    }
  }

  /**
   * Retrieves a single pantry item by its ID.
   * @param id - The unique identifier of the item.
   * @returns Promise resolving to the PantryItem object.
   * @throws RepositoryError if the item is not found or query fails.
   */
  static async getItemById(id: string): Promise<PantryItem> {
    if (!id || typeof id !== 'string') {
      throw new RepositoryError('Invalid item ID provided');
    }

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new RepositoryError(`Item with ID ${id} not found`, 'NOT_FOUND');
        }
        console.error('Error fetching item by ID:', error);
        throw new RepositoryError(`Failed to fetch item: ${error.message}`, error.code);
      }
      return data;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      console.error('Unexpected error in getItemById:', error);
      throw new RepositoryError('Unexpected error occurred while fetching item');
    }
  }

  /**
   * Adds a new pantry item to the database.
   * @param item - The data transfer object for creating the item.
   * @returns Promise resolving to the created PantryItem.
   * @throws RepositoryError if validation fails or insertion fails.
   */
  static async addItem(item: CreatePantryItemDTO): Promise<PantryItem> {
    if (!item || typeof item !== 'object') {
      throw new RepositoryError('Invalid item data provided');
    }

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error('Error adding item:', error);
        throw new RepositoryError(`Failed to add item: ${error.message}`, error.code);
      }
      return data;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      console.error('Unexpected error in addItem:', error);
      throw new RepositoryError('Unexpected error occurred while adding item');
    }
  }

  /**
   * Updates an existing pantry item.
   * @param id - The unique identifier of the item to update.
   * @param updates - The partial updates to apply.
   * @returns Promise resolving to the updated PantryItem.
   * @throws RepositoryError if the item is not found, updates are invalid, or update fails.
   */
  static async updateItem(id: string, updates: UpdatePantryItemDTO): Promise<PantryItem> {
    if (!id || typeof id !== 'string') {
      throw new RepositoryError('Invalid item ID provided');
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      throw new RepositoryError('Invalid updates provided');
    }

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new RepositoryError(`Item with ID ${id} not found`, 'NOT_FOUND');
        }
        console.error('Error updating item:', error);
        throw new RepositoryError(`Failed to update item: ${error.message}`, error.code);
      }
      return data;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      console.error('Unexpected error in updateItem:', error);
      throw new RepositoryError('Unexpected error occurred while updating item');
    }
  }

  /**
   * Deletes a pantry item by its ID.
   * @param id - The unique identifier of the item to delete.
   * @returns Promise resolving when the item is deleted.
   * @throws RepositoryError if the item is not found or deletion fails.
   */
  static async deleteItem(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new RepositoryError('Invalid item ID provided');
    }

    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          throw new RepositoryError(`Item with ID ${id} not found`, 'NOT_FOUND');
        }
        console.error('Error deleting item:', error);
        throw new RepositoryError(`Failed to delete item: ${error.message}`, error.code);
      }
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      console.error('Unexpected error in deleteItem:', error);
      throw new RepositoryError('Unexpected error occurred while deleting item');
    }
  }
}
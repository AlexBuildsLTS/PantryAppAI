/**
 * @file FoodItemRepository.ts
 * @description High-performance data access for inventory items.
 * FIX: Re-routed imports to ../../lib/supabase.
 */

import { supabase } from '../../lib/supabase';
import {
  PantryItem,
  CreatePantryItemDTO,
  UpdatePantryItemDTO,
} from '../../types/PantryItem';

export class FoodItemRepository {
  private static readonly TABLE_NAME = 'pantry_items' as const;

  /**
   * Fetches inventory sorted by expiration date.
   */
  static async getAllItems(): Promise<PantryItem[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .order('expiry_date', { ascending: true }); // Ensure matches SQL column name

    if (error) throw error;
    return data || [];
  }

  static async addItem(item: CreatePantryItemDTO): Promise<PantryItem> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateItem(id: string, updates: UpdatePantryItemDTO): Promise<PantryItem> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
/**
 * @file FoodItemRepository.ts
 * @description Enterprise-grade data access layer for the Pantry.
 * UPDATED: Added batch insertion support for the Shopping Sync engine.
 */

import { supabase, handleSupabaseError } from '../supabase';
import {
  PantryItem,
  CreatePantryItemDTO,
  UpdatePantryItemDTO,
} from '../../types/PantryItem';

export class FoodItemRepository {
  private static readonly TABLE_NAME = 'pantry_items' as const;

  static async getAllItems(): Promise<PantryItem[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(handleSupabaseError(error));
    return data || [];
  }

  /**
   * AAA+ MODULE: BATCH INGESTION
   * Description: Handles bulk migration from Shopping List to Inventory.
   */
  static async batchAdd(items: any[]): Promise<void> {
    const { error } = await supabase.from(this.TABLE_NAME).insert(items);

    if (error) throw new Error(handleSupabaseError(error));
  }

  

  static async addItem(item: CreatePantryItemDTO): Promise<PantryItem> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert([item])
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error));
    return data;
  }

  static async updateItem(
    id: string,
    updates: UpdatePantryItemDTO
  ): Promise<PantryItem> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error));
    return data;
  }

  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);
    if (error) throw new Error(handleSupabaseError(error));
  }

  static async uploadImage(userId: string, fileUri: string): Promise<string> {
    const path = `${userId}/${Date.now()}.jpg`;
    const formData = new FormData();
    // @ts-ignore
    formData.append('file', {
      uri: fileUri,
      name: 'item.jpg',
      type: 'image/jpeg',
    });

    const { error } = await supabase.storage
      .from('pantry-items')
      .upload(path, formData);
    if (error) throw new Error(handleSupabaseError(error));

    const { data } = supabase.storage.from('pantry-items').getPublicUrl(path);
    return data.publicUrl;
  }

  static subscribeToChanges(onUpdate: (payload: any) => void) {
    return supabase
      .channel('pantry_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: this.TABLE_NAME },
        onUpdate
      )
      .subscribe();
  }
}

/**
 * @file FoodItemRepository.ts
 * @description Enterprise-grade data access layer for the Pantry.
 * Implements the Repository Pattern using the 'pantry_items' table.
 */

import { supabase, handleSupabaseError } from '../supabase';
import {
  PantryItem,
  CreatePantryItemDTO,
  UpdatePantryItemDTO,
} from '../../types/PantryItem';

export class FoodItemRepository {
  /**
   * The actual table name from your Supabase Schema is 'pantry_items'.
   * Using 'as const' ensures TypeScript treats this as a literal type for the Supabase client.
   */
  private static readonly TABLE_NAME = 'pantry_items' as const;

  /**
   * Fetches the complete inventory.
   */
  static async getAllItems(): Promise<PantryItem[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(handleSupabaseError(error));
    return data || [];
  }

  /**
   * Inserts a new pantry item.
   */
  static async addItem(item: CreatePantryItemDTO): Promise<PantryItem> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert([item])
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error));
    return data;
  }

  /**
   * Updates an item's metadata or quantity.
   */
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

  /**
   * Permanent removal of an item from the inventory.
   */
  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw new Error(handleSupabaseError(error));
  }

  /**
   * Uploads an item image to the 'pantry-items' storage bucket.
   * Path format: {user_id}/{timestamp}.jpg
   */
  static async uploadImage(userId: string, fileUri: string): Promise<string> {
    const path = `${userId}/${Date.now()}.jpg`;

    const formData = new FormData();
    // @ts-ignore: React Native FormData requires specific object for files
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

  /**
   * Real-time subscription for inventory changes.
   * Crucial for collaborative family pantry management.
   */
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

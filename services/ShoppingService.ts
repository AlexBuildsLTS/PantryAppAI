/**
 * @file ShoppingService.ts
 * @description Enterprise orchestration for automated replenishment.
 * FIX: Re-routed imports to the unified lib/supabase singleton.
 */

import { supabase } from '../lib/supabase';
import { Tables, TablesInsert } from '../types/database.types';
import { PostgrestError } from '@supabase/supabase-js';

type ShoppingListItem = Tables<'shopping_list_items'>;
type ShoppingList = Tables<'shopping_lists'>;
type PantryItemInsert = TablesInsert<'pantry_items'>;

export class ShoppingService {

  /**
   * Resolves or bootstraps the primary household shopping list.
   */
  static async fetchActiveShoppingList(householdId: string): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_completed', false)
      .maybeSingle();

    if (error) throw error;

    if (data) return data as ShoppingList;

    // Create initial 'Main Grocery' list for new households
    const { data: newList, error: createError } = await supabase
      .from('shopping_lists')
      .insert({
        household_id: householdId,
        name: 'Main Grocery',
        is_completed: false
      })
      .select()
      .single();

    if (createError) throw createError;
    return newList as ShoppingList;
  }

  /**
   * Fetches all items for a given shopping list ID.
   */
  static async fetchShoppingListItems(listId: string): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ShoppingListItem[];
  }

  /**
   * Creates a new shopping list item.
   */
  static async createShoppingListItem(listId: string, name: string, userId: string): Promise<PostgrestError | null> {
    const { error } = await supabase.from('shopping_list_items').insert({
      list_id: listId,
      name,
      added_by: userId,
      category: 'Pantry Essentials',
      is_bought: false
    });
    return error;
  }

  /**
   * Toggles the is_bought status of a shopping list item.
   */
  static async toggleItemStatus(itemId: string, currentStatus: boolean): Promise<PostgrestError | null> {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_bought: !currentStatus } as any)
      .eq('id', itemId);
    return error;
  }

  /**
   * Moves all bought items from the shopping list to the pantry (restock operation).
   * FIX: Includes expiry_date to satisfy NOT NULL database constraint.
   */
  static async restockItems(boughtItems: ShoppingListItem[], householdId: string, userId: string): Promise<void> {
    if (boughtItems.length === 0) return;

    // Map bought items to Pantry Schema
    const pantryInserts: PantryItemInsert[] = boughtItems.map((item) => ({
      household_id: householdId,
      user_id: userId,
      name: item.name,
      category: item.category || 'Other',
      quantity: item.quantity || 1,
      unit: 'pcs',
      status: 'fresh',
      // Required field: expiry_date
      expiry_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      // Optional nullable fields
      opened_at: null,
      purchase_date: null,
      storage_id: null,
      vision_metadata: null
    }));

    // 1. Commit to Inventory
    const { error: insertError } = await supabase.from('pantry_items').insert(pantryInserts);
    if (insertError) throw insertError;

    // 2. Clear from Shopping List
    const { error: deleteError } = await supabase
      .from('shopping_list_items')
      .delete()
      .in('id', boughtItems.map((i) => i.id));

    if (deleteError) throw deleteError;
  }

  /**
   * Adds a batch of missing ingredients to the active household list.
   * Stability: Uses .maybeSingle() to handle cases where no list exists.
   */
  static async addMissingToGroceries(householdId: string, items: string[]) {
    try {
      // 1. Resolve active list
      let { data: activeList } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('household_id', householdId)
        .eq('is_completed', false)
        .limit(1)
        .maybeSingle();

      // 2. Create list if none exists
      if (!activeList) {
        const { data, error: createError } = await supabase
          .from('shopping_lists')
          .insert({ household_id: householdId, name: 'Recipe Essentials' })
          .select()
          .single();

        if (createError) throw createError;
        activeList = data;
      }

      // 3. Batch insert items
      if (!activeList?.id) throw new Error('Active shopping list ID not found');

      const inserts = items.map((name) => ({
        list_id: activeList!.id,
        name: name,
        quantity: 1,
        is_bought: false,
      }));

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(inserts);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[ShoppingService] Batch error:', error);
      return { success: false, error };
    }
  }
}
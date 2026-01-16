/**
 * @file ShoppingService.ts
 * @description Enterprise orchestration for automated replenishment.
 * FIX: Re-routed imports to the unified lib/supabase singleton.
 */

import { supabase } from '../lib/supabase';

export class ShoppingService {
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
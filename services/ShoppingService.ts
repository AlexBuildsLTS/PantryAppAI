/**
 * @file ShoppingService.ts
 * @description Enterprise orchestration for automated replenishment.
 */

import { supabase } from './supabase';

export class ShoppingService {
  /**
   * Adds a batch of missing ingredients to the active household list.
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
        .single();

      // 2. Create list if none exists
      if (!activeList) {
        const { data } = await supabase
          .from('shopping_lists')
          .insert({ household_id: householdId, name: 'Recipe Essentials' })
          .select()
          .single();
        activeList = data;
      }

      // 3. Batch insert items
      const inserts = items.map((name) => ({
        list_id: activeList?.id,
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

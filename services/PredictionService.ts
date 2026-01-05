/**
 * @file PredictionService.ts
 * @description Logic engine for forecasting inventory expiration risks.
 */

import { Tables } from '../types/database.types';

type PantryItem = Tables<'pantry_items'>;

export class PredictionService {
  /**
   * Identifies items at risk of expiring in the next 7 days.
   * Calculates projected waste by mass and count.
   */
  static getWasteForecast(items: PantryItem[]) {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const atRiskItems = items.filter((item) => {
      if (
        !item.expiry_date ||
        item.status === 'consumed' ||
        item.status === 'wasted'
      )
        return false;

      const expiry = new Date(item.expiry_date);
      // Items expiring within the next 7 days that are currently 'fresh' or 'expiring_soon'
      return expiry <= sevenDaysFromNow && expiry >= now;
    });

    // Calculate projected loss in kilograms
    const totalWeightGrams = atRiskItems.reduce(
      (acc, item) => acc + (item.weight_grams || 0),
      0
    );

    return {
      atRiskItems: atRiskItems.sort(
        (a, b) =>
          new Date(a.expiry_date!).getTime() -
          new Date(b.expiry_date!).getTime()
      ),
      count: atRiskItems.length,
      projectedWasteKg: (totalWeightGrams / 1000).toFixed(2),
    };
  }
}

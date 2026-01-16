/**
 * @file PredictionService.ts
 * @description Forecaster for inventory expiration and sustainability impact.
 */

import { Tables } from '../types/database.types';

type PantryItem = Tables<'pantry_items'>;

export class PredictionService {
  /**
   * Filters items expiring within a 7-day window.
   */
  static getWasteForecast(items: PantryItem[]) {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() + 7);

    const atRiskItems = items.filter((item) => {
      if (!item.expiry_date || item.status === 'consumed' || item.status === 'wasted') {
        return false;
      }
      const expiry = new Date(item.expiry_date);
      return expiry <= threshold && expiry >= now;
    });

    const totalWeightGrams = atRiskItems.reduce(
      (acc, item) => acc + (item.weight_grams || 0),
      0
    );

    return {
      atRiskItems: atRiskItems.sort(
        (a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime()
      ),
      count: atRiskItems.length,
      projectedWasteKg: (totalWeightGrams / 1000).toFixed(2),
    };
  }
}
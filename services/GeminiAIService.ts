/**
 * @file GeminiAIService.ts
 * @description Corrected Edge Function bridge.
 */

import { supabase } from './supabase';
import { CreatePantryItemDTO } from '../types/PantryItem';

export interface AIScanResult {
  detectedItems: Partial<CreatePantryItemDTO>[];
  success: boolean; // Added to match component logic
  error?: string;
}

export class GeminiAIService {
  static async scanFoodImage(base64Image: string): Promise<AIScanResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'pantry-ai-scanner',
        {
          body: { image: base64Image },
        }
      );

      if (error) throw error;

      return {
        detectedItems: data.items || [],
        success: true,
      };
    } catch (error: any) {
      return {
        detectedItems: [],
        success: false,
        error: error.message,
      };
    }
  }
}

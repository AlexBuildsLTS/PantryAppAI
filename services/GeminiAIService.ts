/**
 * @file GeminiAIService.ts
 * @description Cognitive Vision Bridge for Gemini AI.
 * FIX: Corrected payload key to 'image' to match the Edge Function signature.
 */

import { supabase } from '../lib/supabase';
import { CreatePantryItemDTO } from '../types/PantryItem';

export interface AIScanResult {
  detectedItems: Partial<CreatePantryItemDTO>[];
  success: boolean;
  error?: string;
}

export class GeminiAIService {
  /**
   * Invokes the 'pantry-ai-scanner' Edge Function.
   */
  static async scanFoodImage(base64Image: string): Promise<AIScanResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'pantry-ai-scanner',
        {
          body: { image: base64Image },
        }
      );

      if (error) throw error;

      // Extract items from the Edge Function response
      return {
        detectedItems: data.items || [],
        success: true,
      };
    } catch (error: any) {
      console.error('[GeminiAIService] Scan Failure:', error.message);
      return {
        detectedItems: [],
        success: false,
        error: error.message,
      };
    }
  }
}
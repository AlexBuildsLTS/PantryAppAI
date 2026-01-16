/**
 * @file GeminiAIService.ts
 * @description Service for interacting with Gemini AI for food image scanning.
 * Handles communication with the Supabase Edge Function for AI-powered pantry item detection.
 */

import { supabase } from './supabase';
import { CreatePantryItemDTO } from '../types/PantryItem';

/**
 * Interface representing the raw item data returned by the AI scanner function.
 */
interface AIRawItem {
  name: string;
  category: string;
  expiry_days?: number;
  nutritional_data?: any;
  confidence?: number;
}

/**
 * Interface representing the response from the pantry-ai-scanner Edge Function.
 */
interface AIScannerResponse {
  detected_items: AIRawItem[];
}

/**
 * Result of an AI scan operation.
 */
export interface AIScanResult {
  detectedItems: Partial<CreatePantryItemDTO>[];
  success: boolean;
  error?: string;
}

/**
 * Constants used in AI scanning operations.
 */
const AI_CONSTANTS = {
  DEFAULT_QUANTITY: 1,
  DEFAULT_UNIT: 'pcs',
  MILLISECONDS_PER_DAY: 86400000,
} as const;

/**
 * Service class for Gemini AI integration.
 * Provides methods to scan food images and process AI results into pantry items.
 */
export class GeminiAIService {
  /**
   * Scans a food image using AI and returns detected pantry items.
   * @param base64Image - Base64-encoded image data.
   * @returns Promise resolving to the scan result containing detected items or error.
   */
  static async scanFoodImage(base64Image: string): Promise<AIScanResult> {
    try {
      // Input validation
      if (!base64Image || typeof base64Image !== 'string') {
        throw new Error('Invalid input: base64Image must be a non-empty string');
      }

      // Invoke the AI scanner Edge Function
      const { data, error } = await supabase.functions.invoke<AIScannerResponse>(
        'pantry-ai-scanner',
        {
          body: { imageBase64: base64Image },
        }
      );

      if (error) {
        throw new Error(`AI scanner error: ${error.message}`);
      }

      if (!data || !Array.isArray(data.detected_items)) {
        throw new Error('Invalid response: detected_items is not an array');
      }

      // Map raw AI items to pantry item DTOs
      const detectedItems = data.detected_items.map(item =>
        this.mapRawItemToPantryItem(item)
      );

      return {
        detectedItems,
        success: true,
      };
    } catch (error) {
      console.error('GeminiAIService.scanFoodImage error:', error);

      let errorMessage = 'An unexpected error occurred during AI scanning';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        detectedItems: [],
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Maps a raw AI item to a partial pantry item DTO.
   * @param rawItem - The raw item data from AI processing.
   * @returns Partial pantry item DTO.
   * @private
   */
  private static mapRawItemToPantryItem(rawItem: AIRawItem): Partial<CreatePantryItemDTO> {
    if (!rawItem.name || !rawItem.category) {
      console.warn('GeminiAIService: Missing required fields in raw item:', rawItem);
    }

    const expiryDate = rawItem.expiry_days
      ? new Date(Date.now() + rawItem.expiry_days * AI_CONSTANTS.MILLISECONDS_PER_DAY)
          .toISOString()
          .split('T')[0]
      : undefined;

    return {
      name: rawItem.name || 'Unknown Item',
      category: rawItem.category || 'Other',
      quantity: AI_CONSTANTS.DEFAULT_QUANTITY,
      unit: AI_CONSTANTS.DEFAULT_UNIT,
      expiry_date: expiryDate,
      nutritional_info: rawItem.nutritional_data || null,
      ai_confidence_score: rawItem.confidence || null,
    };
  }
}
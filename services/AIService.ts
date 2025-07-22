import { AIDetectionResult } from '@/types';
import { AppError } from '@/utils/errorHandler';

class AIServiceClass {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeImage(imageUri: string): Promise<AIDetectionResult[]> {
    try {
      // Mock AI detection - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      const mockResults: AIDetectionResult[] = [
        {
          itemName: 'Organic Milk',
          confidence: 0.95,
          category: 'Dairy',
          suggestedLocation: 'Fridge',
          estimatedExpiry: 7,
        },
        {
          itemName: 'Eggs',
          confidence: 0.88,
          category: 'Dairy',
          suggestedLocation: 'Fridge',
          estimatedExpiry: 14,
        },
        {
          itemName: 'Apples',
          confidence: 0.92,
          category: 'Fruits',
          suggestedLocation: 'Fridge',
          estimatedExpiry: 10,
        },
        {
          itemName: 'Bread',
          confidence: 0.85,
          category: 'Bakery',
          suggestedLocation: 'Pantry',
          estimatedExpiry: 5,
        },
        {
          itemName: 'Yogurt',
          confidence: 0.90,
          category: 'Dairy',
          suggestedLocation: 'Fridge',
          estimatedExpiry: 14,
        },
      ];

      return mockResults;
    } catch (error) {
      throw new AppError('Failed to analyze image', 'AI_ANALYSIS_FAILED');
    }
  }

  async getRecipeSuggestions(ingredients: string[]): Promise<any[]> {
    try {
      // Mock recipe suggestions - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockRecipes = [
        {
          id: '1',
          title: 'Creamy Scrambled Eggs',
          matchPercentage: 95,
          cookTime: 10,
          difficulty: 'Easy',
          ingredients: ['eggs', 'milk', 'butter'],
        },
        {
          id: '2',
          title: 'Apple Cinnamon Toast',
          matchPercentage: 80,
          cookTime: 15,
          difficulty: 'Easy',
          ingredients: ['bread', 'apples', 'cinnamon'],
        },
      ];

      return mockRecipes;
    } catch (error) {
      throw new AppError('Failed to get recipe suggestions', 'RECIPE_SUGGESTION_FAILED');
    }
  }
}

export const AIService = new AIServiceClass();
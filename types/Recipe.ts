/**
 * @module RecipeTypes
 * Typed interface for Gemini AI generated culinary suggestions.
 */
export interface Recipe {
  title: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  missing: string[]; // Crucial for the Shopping List integration
  calories?: number;
  instructions?: string[];
}

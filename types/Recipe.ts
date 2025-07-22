export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  tags: string[];
  availableIngredients?: number;
  matchPercentage?: number;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
  available?: boolean;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}
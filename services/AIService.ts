import { AIDetectionResult } from '@/types';
import { AppError } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class AIServiceClass {
  private apiKey: string | null = null;
  private readonly API_KEY_STORAGE = '@pantrypal_ai_api_key';

  async initialize() {
    try {
      const storedKey = await AsyncStorage.getItem(this.API_KEY_STORAGE);
      if (storedKey) {
        this.apiKey = storedKey;
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  }

  async setApiKey(key: string) {
    this.apiKey = key;
    try {
      await AsyncStorage.setItem(this.API_KEY_STORAGE, key);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  }

  async getApiKey(): Promise<string | null> {
    if (!this.apiKey) {
      await this.initialize();
    }
    return this.apiKey;
  }

  async analyzeImage(imageBase64: string): Promise<AIDetectionResult[]> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        // Fallback to mock data if no API key is set
        return this.getMockResults();
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image and identify all food items visible. For each food item, provide:
                  1. Item name (be specific, e.g., "Red Apples" instead of just "Apples")
                  2. Confidence score (0-1)
                  3. Suggested storage location (Pantry, Fridge, or Freezer)
                  4. Estimated days until expiry from today
                  5. Food category (Fruits, Vegetables, Dairy, Meat, etc.)
                  
                  Return the response as a JSON array with this exact structure:
                  [
                    {
                      "itemName": "string",
                      "confidence": number,
                      "suggestedLocation": "Pantry|Fridge|Freezer",
                      "estimatedExpiry": number,
                      "category": "string"
                    }
                  ]
                  
                  Only return the JSON array, no other text.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
          'OPENAI_API_ERROR'
        );
      }

      const data: OpenAIVisionResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new AppError('No response from OpenAI Vision API', 'NO_AI_RESPONSE');
      }

      try {
        // Parse the JSON response from OpenAI
        const parsedResults = JSON.parse(content);
        
        if (!Array.isArray(parsedResults)) {
          throw new Error('Response is not an array');
        }

        // Validate and transform the results
        const results: AIDetectionResult[] = parsedResults
          .filter(item => item.itemName && item.confidence > 0.3) // Filter low confidence items
          .map(item => ({
            itemName: item.itemName,
            confidence: Math.min(Math.max(item.confidence, 0), 1), // Clamp between 0-1
            category: item.category || 'Other',
            suggestedLocation: ['Pantry', 'Fridge', 'Freezer'].includes(item.suggestedLocation) 
              ? item.suggestedLocation as 'Pantry' | 'Fridge' | 'Freezer'
              : 'Pantry',
            estimatedExpiry: Math.max(1, Math.min(item.estimatedExpiry || 7, 365)) // Clamp between 1-365 days
          }));

        if (results.length === 0) {
          throw new AppError('No food items detected in the image', 'NO_ITEMS_DETECTED');
        }

        return results;

      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.log('Raw OpenAI response:', content);
        
        // Fallback to mock data if parsing fails
        return this.getMockResults();
      }

    } catch (error) {
      console.error('AI Analysis Error:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // For network or other errors, fallback to mock data
      console.log('Falling back to mock data due to error:', error);
      return this.getMockResults();
    }
  }

  private getMockResults(): AIDetectionResult[] {
    const mockResults: AIDetectionResult[] = [
      {
        itemName: 'Fresh Bananas',
        confidence: 0.95,
        category: 'Fruits',
        suggestedLocation: 'Pantry',
        estimatedExpiry: 5,
      },
      {
        itemName: 'Whole Milk',
        confidence: 0.92,
        category: 'Dairy',
        suggestedLocation: 'Fridge',
        estimatedExpiry: 7,
      },
      {
        itemName: 'Red Apples',
        confidence: 0.88,
        category: 'Fruits',
        suggestedLocation: 'Fridge',
        estimatedExpiry: 14,
      },
      {
        itemName: 'Sliced Bread',
        confidence: 0.85,
        category: 'Bakery',
        suggestedLocation: 'Pantry',
        estimatedExpiry: 5,
      },
      {
        itemName: 'Greek Yogurt',
        confidence: 0.90,
        category: 'Dairy',
        suggestedLocation: 'Fridge',
        estimatedExpiry: 10,
      },
    ];

    return mockResults;
  }

  async getRecipeSuggestions(ingredients: string[]): Promise<any[]> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        return this.getMockRecipes();
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `Given these ingredients: ${ingredients.join(', ')}, suggest 3-5 recipes that can be made using some or all of these ingredients. 
              
              Return as JSON array with this structure:
              [
                {
                  "id": "string",
                  "title": "string",
                  "matchPercentage": number,
                  "cookTime": number,
                  "difficulty": "Easy|Medium|Hard",
                  "ingredients": ["string"],
                  "instructions": ["string"],
                  "servings": number
                }
              ]
              
              Only return the JSON array, no other text.`
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new AppError('Failed to get recipe suggestions', 'RECIPE_API_ERROR');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return this.getMockRecipes();
      }

      try {
        const recipes = JSON.parse(content);
        return Array.isArray(recipes) ? recipes : this.getMockRecipes();
      } catch {
        return this.getMockRecipes();
      }

    } catch (error) {
      console.error('Recipe suggestion error:', error);
      return this.getMockRecipes();
    }
  }

  private getMockRecipes(): any[] {
    return [
      {
        id: '1',
        title: 'Creamy Scrambled Eggs',
        matchPercentage: 95,
        cookTime: 10,
        difficulty: 'Easy',
        ingredients: ['eggs', 'milk', 'butter', 'salt', 'pepper'],
        instructions: [
          'Crack eggs into a bowl and whisk with milk',
          'Heat butter in a non-stick pan over medium-low heat',
          'Pour in eggs and gently stir continuously',
          'Season with salt and pepper before serving'
        ],
        servings: 2
      },
      {
        id: '2',
        title: 'Apple Cinnamon Toast',
        matchPercentage: 80,
        cookTime: 15,
        difficulty: 'Easy',
        ingredients: ['bread', 'apples', 'cinnamon', 'butter', 'honey'],
        instructions: [
          'Toast bread slices until golden',
          'Slice apples thinly',
          'Spread butter on toast, top with apple slices',
          'Sprinkle with cinnamon and drizzle with honey'
        ],
        servings: 2
      },
    ];
  }

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
}

export const AIService = new AIServiceClass();
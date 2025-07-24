import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AIDetectionResult, Recipe } from '@/types';
import { AppError } from '@/utils/errorHandler';

// Define the structure of the expected OpenAI API response
interface OpenAIVisionResponse {
  choices: Array<{ message: { content: string; }; }>;
}

const API_KEY_STORAGE_KEY = '@pantrypal_ai_api_key';

class AIServiceClass {
  private apiKey: string | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // Load the API key from storage once when the service is created
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      this.apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load API key on initialization:', error);
    }
  }

  async setApiKey(key: string): Promise<void> {
    this.apiKey = key;
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new AppError('Could not save API key to storage.');
    }
  }

  async getApiKey(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.apiKey;
  }

  // Tests if a given API key is valid by making a lightweight call to the OpenAI API
  async testApiKey(key: string): Promise<boolean> {
    if (!key) return false;
    try {
      await axios.get('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Analyzes an image using the OpenAI Vision API
  async analyzeImage(base64Image: string): Promise<AIDetectionResult[]> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new AppError('AI API key is not set. Please add it in the settings.', 'API_KEY_MISSING');
    }

    try {
      const response = await axios.post<OpenAIVisionResponse>(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: "Analyze this image to identify all food items. Respond ONLY with a valid JSON array of objects. Each object must have keys: 'itemName' (string), 'category' (string), 'suggestedLocation' ('Pantry', 'Fridge', or 'Freezer'), and 'estimatedExpiry' (number, in days). Do not include any other text, markdown, or explanations."
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
              ],
            },
          ],
          max_tokens: 1500,
        },
        {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('No response from AI service.', 'NO_AI_RESPONSE');
      }

      const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedResults: any[] = JSON.parse(jsonString);

      if (!Array.isArray(parsedResults)) throw new Error('AI response is not a valid array.');

      return parsedResults.map(item => ({
        itemName: item.itemName || 'Unknown Item',
        confidence: item.confidence || 0.9, // Default confidence if not provided
        category: item.category || 'Other',
        suggestedLocation: ['Pantry', 'Fridge', 'Freezer'].includes(item.suggestedLocation) ? item.suggestedLocation : 'Pantry',
        estimatedExpiry: Math.max(1, item.estimatedExpiry || 7),
      }));

    } catch (error: any) {
      console.error("OpenAI API Error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new AppError('Invalid OpenAI API Key. Please check your key in settings.', 'INVALID_API_KEY');
      }
      throw new AppError('Failed to analyze image with the AI service.', 'AI_ANALYSIS_FAILED');
    }
  }

  // Your original mock results function, preserved as a private fallback
  private getMockResults(): AIDetectionResult[] {
    return [
      { itemName: 'Fresh Bananas', confidence: 0.95, category: 'Fruits', suggestedLocation: 'Pantry', estimatedExpiry: 5 },
      { itemName: 'Whole Milk', confidence: 0.92, category: 'Dairy', suggestedLocation: 'Fridge', estimatedExpiry: 7 },
    ];
  }
}

export const AIService = new AIServiceClass();
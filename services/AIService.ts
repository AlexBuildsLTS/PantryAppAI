import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AIDetectionResult } from '@/types';
import { AppError } from '@/utils/errorHandler';

const API_KEY_STORAGE = '@pantrypal_ai_api_key';

class AIServiceClass {
  private apiKey: string | null = null;

  constructor() {
    this.loadApiKey();
  }

  async setApiKey(key: string): Promise<void> {
    this.apiKey = key;
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
  }

  async loadApiKey(): Promise<void> {
    this.apiKey = await AsyncStorage.getItem(API_KEY_STORAGE);
  }

  async analyzeImage(base64Image: string): Promise<AIDetectionResult[]> {
    if (!this.apiKey) {
      throw new AppError('AI API key is not set. Please add it in the settings.', 'API_KEY_MISSING');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: "Identify all the food items in this image. For each item, provide its name, a suggested storage location ('Pantry', 'Fridge', or 'Freezer'), and an estimated expiry in days from now. Format the response as a JSON array of objects with keys: 'itemName', 'suggestedLocation', 'estimatedExpiry'."
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
              ],
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      // Clean up the response from OpenAI, which is often wrapped in markdown
      const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedResults: AIDetectionResult[] = JSON.parse(jsonString);
      return parsedResults.map(item => ({ ...item, confidence: 0.9 })); // Add a default confidence

    } catch (error: any) {
      console.error("OpenAI API Error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new AppError('Invalid OpenAI API Key. Please check your key in the settings.', 'INVALID_API_KEY');
      }
      throw new AppError('Failed to analyze image with AI service.', 'AI_ANALYSIS_FAILED');
    }
  }
}

export const AIService = new AIServiceClass();
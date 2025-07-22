import { Alert } from 'react-native';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown, context?: string): void => {
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  let message = 'An unexpected error occurred';
  
  if (error instanceof AppError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }
  
  Alert.alert('Error', message);
};

export const logError = (error: unknown, context?: string): void => {
  console.error(`[${new Date().toISOString()}] Error in ${context}:`, error);
  // In production, send to crash reporting service
};
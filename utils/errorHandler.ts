/**
 * @module ErrorHandler
 * Centralized error orchestration for the Pantry Pal ecosystem.
 * Handles Supabase/PostgreSQL errors and provides user-friendly feedback.
 */

import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Custom application error class with metadata support.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Centralized Error Dispatcher.
 * Triggers haptic feedback and displays intuitive alerts.
 */
export const handleError = (error: unknown, context: string): void => {
  // 1. Silent logging for developers (Sync to Sentry/LogRocket in production)
  console.error(`[${context.toUpperCase()}]`, error);

  // 2. Trigger Error Haptics
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

  let userMessage = 'Something went wrong. Please try again.';

  // 3. Handle Supabase / PostgreSQL specific errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as { code: string; message: string };
    switch (pgError.code) {
      case '23505':
        userMessage = 'This item already exists in your pantry.';
        break;
      case '42501':
        userMessage = 'Permission denied. Please check your account.';
        break;
      case 'PGRST116':
        userMessage = 'Multiple items found where one was expected.';
        break;
    }
  }

  // 4. Handle Auth errors
  if (error instanceof Error) {
    if (error.message.includes('invalid_credentials')) {
      userMessage = 'Incorrect email or password.';
    } else {
      userMessage = error.message;
    }
  }

  // 5. Final Alert to user
  Alert.alert('Action Required', userMessage, [{ text: 'OK' }]);
};

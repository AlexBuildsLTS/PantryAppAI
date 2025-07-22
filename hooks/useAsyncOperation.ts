import { useState, useCallback } from 'react';
import { AsyncOperationResult } from '@/types';
import { handleError } from '@/utils/errorHandler';

export function useAsyncOperation<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    context?: string
  ): Promise<AsyncOperationResult<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await operation();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      handleError(err, context);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}
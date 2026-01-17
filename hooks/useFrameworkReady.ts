/**
 * @module useFrameworkReady
 * @description
 * An enterprise-grade lifecycle hook that signals the completion of the 
 * JavaScript framework initialization. Now modified to return a boolean 
 * state to orchestrate root layout mounting and splash screen management.
 * * @returns {boolean} frameworkReady - Returns true once the framework is hydrated.
 */

import { useEffect, useState } from 'react';

/**
 * Extends the global Window interface to include the frameworkReady
 * signal, preventing TypeScript "property does not exist" errors.
 */
declare global {
  interface Window {
    /**
     * Optional signal used by Expo/React Native performance tools 
     * to measure "Time to Interactive" (TTI).
     */
    frameworkReady?: () => void;
  }
}

/**
 * useFrameworkReady
 * Orchestrates the post-mount signal and provides a stateful ready flag.
 */
export function useFrameworkReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check if the global window object exists (safe for Web/SSR)
    if (typeof window !== 'undefined' && window.frameworkReady) {
      try {
        // 2. Execute the native framework signal
        window.frameworkReady();
      } catch {
      }
    }

    // 4. Update the internal state to signal hydration completion
    setIsReady(true);
  }, []); // Run exactly once on mount

  return isReady;
}
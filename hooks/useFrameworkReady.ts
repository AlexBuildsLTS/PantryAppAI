/**
 * @module useFrameworkReady
 * @description
 * A high-level lifecycle hook designed to signal the completion of the
 * JavaScript framework initialization. This is critical for preventing
 * race conditions during the mounting of heavy native modules (e.g., Camera,
 * Reanimated, and Auth hydration).
 * * @example
 * useFrameworkReady();
 */

import { useEffect } from 'react';

/**
 * Extends the global Window interface to include the frameworkReady
 * signal, which is often used by automated testing suites and
 * performance monitoring tools to measure "Time to Interactive" (TTI).
 */
declare global {
  interface Window {
    /**
     * Optional signal to external environments (like WebViews or
     * monitoring tools) that the React Native framework is fully hydrated.
     */
    frameworkReady?: () => void;
  }
}

/**
 * useFrameworkReady
 * * Orchestrates the post-mount signal to ensure that external listeners
 * and internal native bridges are aware that the component tree is stable.
 */
export function useFrameworkReady(): void {
  useEffect(() => {
    // 1. Check if the global window object exists (safe for Web/SSR)
    if (typeof window !== 'undefined' && window.frameworkReady) {
      try {
        // 2. Execute the signal
        window.frameworkReady();
      } catch (error) {
        // 3. Fail silently in production to avoid disrupting the UI
        console.warn('[FrameworkReady] Signal failed to execute:', error);
      }
    }
  }, []); // Run exactly once on mount
}

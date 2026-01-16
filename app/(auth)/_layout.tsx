/**
 * @file app/(auth)/_layout.tsx
 * @description Master Auth Layout with Enterprise Routing & Design.
 * Resolves: [Layout children] No route named "sign-in" exists.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  const { colors, isDark } = useTheme();

  return (
    <>
      {/* AAA+ TRANSITION: 
        Synchronizes status bar with current theme mode instantly.
      */}
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerShown: false,
          /** * DESIGN STANDARD: 
           * fade_from_bottom provides a premium modal-like entrance for auth.
           */
          animation: 'fade_from_bottom',
          contentStyle: {
            backgroundColor: colors.background // Slate-50 in Light Mode for contrast
          },
        }}
      >
        {/* CRITICAL: Explicitly define names to match file structure 
          app/(auth)/sign-in.tsx -> name="sign-in"
        */}
        <Stack.Screen
          name="sign-in"
          options={{
            title: 'Sign In',
            gestureEnabled: false, // Security: Prevent swipe back from auth
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            title: 'Create Account',
          }}
        />
      </Stack>
    </>
  );
}
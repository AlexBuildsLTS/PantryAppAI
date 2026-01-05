/**
 * @file app/(auth)/_layout.tsx
 * @description Layout for the authentication stack.
 * Ensures unauthenticated users see the Sign In/Up screens without tabs.
 */

import React from 'react';
import { Stack } from 'expo-router';

/**
 * We use a simple Stack here to manage transition between Sign In and Sign Up.
 * The redirect logic is handled by the Root Layout in app/_layout.tsx.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F172A' },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}

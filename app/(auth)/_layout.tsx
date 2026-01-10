/**
 * @file app/(auth)/_layout.tsx
 * @description Master Auth Layout with Theme Synchronization.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </>
  );
}
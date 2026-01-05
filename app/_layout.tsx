/**
 * @file app/_layout.tsx
 * @description Master Root Orchestrator.
 * Fixes: Context Provider nesting error.
 * Handles: Biometrics, Splash Screen, and Global Providers.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, AppState, Text } from 'react-native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Internal Systems
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { BiometricService } from '../services/BiometricService';

// Keep the splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * InnerLayout: Handles security and UI logic.
 * This is nested inside ThemeProvider so useTheme() works.
 */
function InnerLayout() {
  const { colors } = useTheme();
  const [isLocked, setIsLocked] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  // 1. Initial Resource Setup
  useEffect(() => {
    async function prepare() {
      try {
        // Simulating resource loading (fonts, api checks)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // 2. Biometric Auth Handler
  const performAuth = useCallback(async () => {
    const success = await BiometricService.authenticate();
    if (success) setIsLocked(false);
  }, []);

  useEffect(() => {
    if (appIsReady) performAuth();
  }, [appIsReady, performAuth]);

  // 3. Security: Lock on Background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        setIsLocked(true);
      } else if (nextAppState === 'active') {
        performAuth();
      }
    });
    return () => subscription.remove();
  }, [performAuth]);

  // 4. Smooth Transition from Splash
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !isLocked) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, isLocked]);

  if (!appIsReady) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      onLayout={onLayoutRootView}
    >
      {/* The main app content */}
      <Slot />

      {/* SECURITY OVERLAY (AAA+ Glassmorphic Lock) */}
      {isLocked && (
        <BlurView intensity={100} tint="dark" style={styles.lockOverlay}>
          <View
            style={[
              styles.shieldContainer,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Feather name="shield" size={40} color={colors.primary} />
            <Text style={[styles.lockText, { color: colors.primary }]}>
              SECURE SESSION
            </Text>
          </View>
        </BlurView>
      )}
    </View>
  );
}

/**
 * RootLayout: The entry point that provides contexts to everything below.
 */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <InnerLayout />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  shieldContainer: {
    padding: 30,
    borderRadius: 40,
    alignItems: 'center',
    gap: 15,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

/**
 * @file app/_layout.tsx
 * @description MASTER AAA+ ROOT ARCHITECTURE.
 * FIXES: StyleSheet units, darkMode crash, and unused vars.
 */

// @ts-expect-error - global.css might not have types generated yet
import '../global.css';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  AppState,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { BiometricService } from '../services/BiometricService';

SplashScreen.preventAutoHideAsync().catch(() => null);
const queryClient = new QueryClient();

// AAA+ Web Style Fix: Prevents the 'StyleSheet.setFlag' crash
if (Platform.OS === 'web') {
  // @ts-expect-error - setFlag is internal to react-native-web
  if (typeof StyleSheet.setFlag === 'function') {
    // @ts-expect-error - class mode is web-specific
    StyleSheet.setFlag('darkMode', 'class');
  }
}

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const { isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  const performAuth = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsLocked(false);
      return;
    }
    const isAvailable = await BiometricService.isHardwareAvailable();
    if (!isAvailable) {
      setIsLocked(false);
      return;
    }
    const success = await BiometricService.authenticate();
    if (success) setIsLocked(false);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS !== 'web') {
          const hardware = await BiometricService.isHardwareAvailable();
          if (hardware) setIsLocked(true);
        }
      } catch {
        // Silent catch for production stability
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && isLocked) {
      performAuth();
    }
  }, [appIsReady, isLocked, performAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (Platform.OS === 'web') return;
      if (state.match(/inactive|background/)) {
        setIsLocked(true);
      } else if (state === 'active') {
        performAuth();
      }
    });
    return () => subscription.remove();
  }, [performAuth]);

  useEffect(() => {
    if (!authLoading && appIsReady) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, authLoading, appIsReady, router]);

  useEffect(() => {
    if (appIsReady && !authLoading) {
      SplashScreen.hideAsync().catch(() => null);
    }
  }, [appIsReady, authLoading]);

  if (!appIsReady) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>

      {isLocked && Platform.OS !== 'web' && (
        <BlurView
          intensity={100}
          tint={isDark ? 'dark' : 'light'}
          style={styles.lockOverlay}
        >
          <View style={[styles.shieldBox, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="shield" size={44} color={colors.primary} />
            <Text style={[styles.lockTitle, { color: colors.text }]}>Secure Session</Text>
            <TouchableOpacity
              style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
              onPress={performAuth}
            >
              <Text style={styles.unlockText}>TAP TO UNLOCK</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <View style={styles.rootWrap}>
              <InnerLayout />
            </View>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rootWrap: {
    flex: 1,
    // vh/vw are invalid. 100% is the correct React Native equivalent
    height: '100%',
    width: '100%',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  shieldBox: {
    padding: 40,
    borderRadius: 48,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  unlockBtn: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  unlockText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
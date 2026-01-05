/**
 * @file _layout.tsx
 * @description Master AAA+ Tier Tab Orchestrator.
 * Features:
 * - Hard Authentication Guard (Redirects unauthenticated users)
 * - Glassmorphic BlurView Navigation
 * - Haptic Selection Feedback
 * - Real-time Profile Hydration Check
 * @author Pantry Pal Engineering
 */

import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Internal Systems
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { colors, mode } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isDark = mode === 'dark';

  /**
   * AAA+ AUTHENTICATION GUARD
   * Prevents "Ghost Sessions" by redirecting to Sign-In if no user is found.
   */
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/sign-in');
    }
  }, [user, isLoading, router]);

  /**
   * Selection Haptic Handler
   */
  const handleTabPress = () => {
    Haptics.selectionAsync();
  };

  /**
   * SKELETON LOADER
   * Prevents the "Chef Member" UI flickers during metadata hydration.
   */
  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Premium glassmorphic tab bar styling
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          backgroundColor:
            Platform.OS === 'ios' ? 'transparent' : colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        },
        // Background blur for high-end visual fidelity
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={isDark ? 80 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          letterSpacing: 0.5,
          marginTop: -4,
        },
      }}
    >
      {/* 1. PANTRY (Core Inventory) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'PANTRY',
          tabBarIcon: ({ color }) => (
            <Feather name="package" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 2. SHOPPING (Grocery List Engine) */}
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'SHOPPING',
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-cart" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 3. RECIPES (Chef AI Orchestrator) */}
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'CHEF AI',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chef-hat" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 4. IMPACT (Analytics Dashboard) */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'IMPACT',
          tabBarIcon: ({ color }) => (
            <Feather name="bar-chart-2" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 5. ALERTS (Notification Hub) */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'ALERTS',
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="bell" size={22} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 6. ACCOUNT (Profile & Household Storage) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'ACCOUNT',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

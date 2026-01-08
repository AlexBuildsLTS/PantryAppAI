/**
 * @file _layout.tsx
 * @description Master Tab Navigation & Authentication Orchestrator.
 * * AAA+ DESIGN PATTERNS:
 * 1. Hard Authentication Guard: Enforces session-only access.
 * 2. Hydration Management: Prevents "Ghost Profiles" via strict loading states.
 * 3. Haptic Integration: Native tactile feedback on tab transitions.
 * 4. Glassmorphic UI: High-fidelity BlurView orchestration for iOS.
 */

import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Internal System Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  /**
   * MODULE 1: AUTHENTICATION ENFORCEMENT
   * Description: Redirects unauthenticated users to the login flow immediately
   * upon session expiration or invalid state.
   */
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/sign-in');
    }
  }, [user, isLoading, router]);

  /**
   * MODULE 2: HAPTIC FEEDBACK ORCHESTRATOR
   * Description: Triggers selection-style vibration to match native iOS/Android
   * system behavior for premium user experience.
   */
  const handleTabPress = () => {
    Haptics.selectionAsync();
  };

  /**
   * MODULE 3: HYDRATION GUARD (SKELETON)
   * Description: Blocks the rendering of the tab bar and sub-screens until
   * Supabase Auth has finished profile lookup to prevent "Chef Member" UI ghosting.
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

        // MODULE 4: PREMIUM NAVIGATION STYLING
        // Description: Implements absolute positioning for the tab bar to
        // enable background transparency and blurred layering.
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

        // MODULE 5: GLASSMORPHIC EFFECT ENGINE
        // Description: Only active on iOS. Provides an intensity-controlled
        // blur that adapts to the current system theme (Dark/Light).
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
      {/* SECTION 1: CORE INVENTORY (PANTRY) */}
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

      {/* SECTION 2: SUPPLY CHAIN LOGISTICS (SHOPPING) */}
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

      {/* SECTION 3: AI INTELLIGENCE (CHEF AI) */}
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

      {/* SECTION 4: SUSTAINABILITY METRICS (IMPACT) */}
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

      {/* SECTION 5: REAL-TIME NOTIFICATIONS (ALERTS) */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'ALERTS',
          tabBarIcon: ({ color }) => (
            <Feather name="bell" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 6: COMMAND CENTER (ACCOUNT) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'ACCOUNT',
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
    </Tabs>
  );
}

/**
 * MODULE 7: INTERNAL COMPONENT STYLES
 */
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

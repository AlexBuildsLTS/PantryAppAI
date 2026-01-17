/**
 * @file app/(tabs)/_layout.tsx
 * -----------------------------------------------------------------------------------
 * FIXES:
 *  LAYOUT STABILITY: Removes absolute positioning on Web to fix "zoom-out" bugs.
 *  HAPTIC ENGINE: Web-safe vibration handling.
 *  GLASSMORPHISM: Environment-aware blur intensity for iOS vs Android/Web.
 * -----------------------------------------------------------------------------------
 */

import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Internal System Infrastructure
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();

  /**
   * MODULE: HAPTIC FEEDBACK
   * Description: Triggers selection feedback for Native Mobile; silent for Web.
   */
  const handleTabPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => null);
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,

        /**
         * MODULE: DYNAMIC TAB STYLING
         * Fix: Uses 'position: absolute' ONLY on native for blur effects.
         * Web uses standard flow to prevent the layout from stretching (Zoom bug).
         */
        tabBarStyle: {
          position: Platform.OS === 'web' ? 'relative' : 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
          // Fixed: Use boxShadow compatible styling
          shadowOpacity: 0,
          paddingBottom: Platform.OS === 'ios' ? 32 : 12,
          paddingTop: 12,
          zIndex: 1000, // Ensure TabBar stays above content but below Modals
        },

        /**
         * MODULE: GLASSMORPHIC BACKGROUND
         */
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={isDark ? 80 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.5,
          marginTop: -4,
        },
      }}
    >
      {/* SECTION 1: INVENTORY */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
          tabBarLabel: 'PANTRY',
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 2: SUPPLY CHAIN */}
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Supply Chain',
          tabBarLabel: 'SHOPPING',
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-cart" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 3: AI KITCHEN */}
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Chef AI',
          tabBarLabel: 'CHEF AI',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chef-hat" size={26} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 4: IMPACT ANALYTICS */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Impact',
          tabBarLabel: 'IMPACT',
          tabBarIcon: ({ color, size }) => (
            <Feather name="pie-chart" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 5: COMMAND CENTER */}
      {/* ADMIN TAB: Only visible to admin */}
      {profile?.role === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarLabel: 'ADMIN',
            tabBarIcon: ({ color, size }) => (
              <Feather name="shield" color={color} size={size} />
            ),
          }}
          listeners={{ tabPress: handleTabPress }}
        />
      )}
      {/* SUPPORT TAB: Always visible */}
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarLabel: 'SUPPORT',
          tabBarIcon: ({ color, size }) => (
            <Feather name="help-circle" color={color} size={size} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Analytics',
          tabBarLabel: 'DASHBOARD',
          tabBarIcon: ({ color, size }) => (
            <Feather name="database" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 6: ALERTS */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarLabel: 'ALERTS',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* SECTION 7: IDENTITY HUB */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Account',
          tabBarLabel: 'ACCOUNT',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
    </Tabs>
  );
}
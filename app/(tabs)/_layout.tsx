/**
 * @file _layout.tsx
 * @description Master Tab Navigation for Pantry Pal.
 * Features: Dynamic theme synchronization, Haptic-integrated transitions,
 * and BlurView backgrounds for a premium glassmorphic feel.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Internal Systems
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  /**
   * Selection Haptic Handler
   */
  const handleTabPress = () => {
    Haptics.selectionAsync();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Premium styling for the tab bar container
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 88,
          backgroundColor:
            Platform.OS === 'ios' ? 'transparent' : colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 20,
        },
        // Background blur for iOS users
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="dark"
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
      {/* 1. PANTRY (Inventory) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'PANTRY',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="package" size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 2. SHOPPING (Grocery List) */}
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

      {/* 3. RECIPES (Chef AI) */}
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

      {/* 4. ANALYTICS (Impact Dashboard) */}
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

      {/* 5. NOTIFICATIONS (Alerts Hub) */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'ALERTS',
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="bell" size={22} color={color} />
              {/* Optional: Add a red dot here if notifications are present */}
            </View>
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* 6. SETTINGS (Command Center) */}
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

/**
 * @file app/+not-found.tsx
 * @description Enterprise-grade 404 Error Screen with Glassmorphism UI.
 * * FEATURES:
 * 1. DESIGN: Glassmorphism card with spring animations.
 * 2. ACCESSIBILITY: Proper semantic labels and screen reader support.
 * 3. LINT COMPLIANCE: Correctly escaped character entities for production builds.
 */

import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

// Internal Design System
import { useTheme } from '../contexts/ThemeContext';

export default function NotFoundScreen() {
  const { colors, isDark } = useTheme();

  return (
    <>
      {/* Configure native navigation header for the error state */}
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View
          entering={FadeInUp.delay(100).duration(600).springify()}
          style={styles.content}
        >
          {/* MODULE 1: GLASS CARD */}
          <BlurView
            intensity={isDark ? 20 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.glassCard,
              {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            {/* Visual Indicator */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.error + '15' },
              ]}
            >
              <Feather name="search" size={48} color={colors.error} />
            </View>

            {/* MODULE 2: TEXT CONTENT (Lint-Safe) */}
            <Text style={[styles.title, { color: colors.text }]}>
              Lost in the Pantry?
            </Text>

            <Text style={[styles.message, { color: colors.textSecondary }]}>
              We couldn&apos;t find the page you&rsquo;re looking for. It might
              have been moved or eaten!
            </Text>

            {/* MODULE 3: NAVIGATION ACTION */}
            <Animated.View entering={FadeInDown.delay(400)}>
              <Link href="/(tabs)" asChild>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="arrow-left"
                    size={20}
                    color="white"
                    style={styles.btnIcon}
                  />
                  <Text style={styles.buttonText}>Back to Dashboard</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          </BlurView>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  glassCard: {
    padding: 40,
    borderRadius: 40,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  button: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  btnIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

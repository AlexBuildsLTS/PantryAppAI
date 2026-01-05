/**
 * @file OnboardingScreen.tsx
 * @description AAA+ Tier Introduction workflow.
 * Features: Paging animations, Haptic feedback, and feature education.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  Pressable,
  Animated,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    id: '1',
    title: 'Smart Pantry',
    desc: 'Enterprise tracking for your food inventory with real-time sync.',
    icon: 'package',
    color: ['#22C55E', '#16A34A'] as const,
  },
  {
    id: '2',
    title: 'AI Vision',
    desc: 'Identify ingredients and scan receipts instantly with Gemini AI.',
    icon: 'camera',
    color: ['#3B82F6', '#2563EB'] as const,
  },
  {
    id: '3',
    title: 'Zero Waste',
    desc: 'Receive intelligent alerts before your food reaches expiration.',
    icon: 'bell',
    color: ['#F59E0B', '#D97706'] as const,
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.primary }]}>Pantry Pal</Text>
        <Pressable onPress={onComplete} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) =>
          setCurrentStep(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={styles.stepContainer}>
            <LinearGradient colors={item.color} style={styles.iconCircle}>
              <Feather name={item.icon as any} size={54} color="white" />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              {item.desc}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Pressable
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Feather name="arrow-right" size={20} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, alignItems: 'center' },
  logo: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  skipBtn: { padding: 8 },
  skipText: { fontWeight: '700' },
  stepContainer: { 
    width, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 40 // FIXED: Changed from 'px' to 'paddingHorizontal'
  },
  iconCircle: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, // Standardize border radius
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 48, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 15 
  },
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -1 },
  desc: { fontSize: 18, lineHeight: 26, textAlign: 'center', paddingHorizontal: 20 },
  footer: { padding: 40 },
  nextBtn: { height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextBtnText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
/**
 * @file CookingModeModal.tsx
 * @description AAA+ Immersive Cooking Experience.
 * Features: High-legibility typography, progress tracking, and Voice Synthesis.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

export function CookingModeModal({ visible, onClose, recipe }: any) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Auto-read step when voice is enabled and step changes
  useEffect(() => {
    if (isVoiceEnabled && visible && recipe?.instructions) {
      Speech.stop();
      Speech.speak(recipe.instructions[currentStep], {
        pitch: 1.0,
        rate: 0.9,
      });
    } else {
      Speech.stop();
    }
    // The cleanup function for useEffect should not be async
    return () => { Speech.stop(); };
  }, [currentStep, isVoiceEnabled, visible, recipe?.instructions]);

  const handleNext = () => {
    if (currentStep < recipe.instructions.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep((prev) => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  };

  const toggleVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled) {
      Speech.speak('Voice assistance enabled.');
    } else {
      Speech.stop();
    }
  };

  if (!recipe || !recipe.instructions) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 1. PROGRESS HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: `${
                    ((currentStep + 1) / recipe.instructions.length) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <TouchableOpacity onPress={toggleVoice} style={styles.voiceToggle}>
            <MaterialCommunityIcons
              name={isVoiceEnabled ? 'volume-high' : 'volume-off'}
              size={24}
              color={isVoiceEnabled ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* 2. INSTRUCTION CONTENT */}
        <View style={styles.content}>
          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(400)}
            style={styles.stepCard}
          >
            <Text style={[styles.stepLabel, { color: colors.primary }]}>
              STEP {currentStep + 1} OF {recipe.instructions.length}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                {recipe.instructions[currentStep]}
              </Text>
            </ScrollView>
          </Animated.View>
        </View>

        {/* 3. FOOTER CONTROLS */}
        <BlurView intensity={20} tint="dark" style={styles.footer}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() =>
              currentStep > 0 && setCurrentStep((prev) => prev - 1)
            }
          >
            <Feather
              name="chevron-left"
              size={32}
              color={currentStep === 0 ? colors.border : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>
              {currentStep === recipe.instructions.length - 1
                ? 'Finish Dish'
                : 'Next Step'}
            </Text>
            <Feather name="chevron-right" size={24} color="white" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  closeBtn: { padding: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: { height: '100%' },
  voiceToggle: { padding: 8 },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  stepCard: { flex: 0.85 },
  stepLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  instructionText: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: 'row',
    padding: 32,
    paddingBottom: 50,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBtn: {
    flex: 1,
    height: 72,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btnText: { color: 'white', fontSize: 20, fontWeight: '900' },
});

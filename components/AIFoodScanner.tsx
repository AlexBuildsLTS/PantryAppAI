/**
 * @file AIFoodScanner.tsx
 * @description Enterprise-grade AI Vision Interface.
 * Features: Glassmorphic controls, Scanning Laser Animation, and Haptic Feedback.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Internal Systems
import { GeminiAIService, AIScanResult } from '../services/GeminiAIService';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AIFoodScannerProps {
  isVisible: boolean;
  onClose: () => void;
  onItemsDetected: (items: any[]) => void;
}

export default function AIFoodScanner({
  isVisible,
  onClose,
  onItemsDetected,
}: AIFoodScannerProps) {
  const { colors, shadows, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  // --- ANIMATION LOGIC ---
  const laserPos = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      laserPos.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1
      );
    }
  }, [isVisible]);

  const laserStyle = useAnimatedStyle(() => ({
    top: `${laserPos.value * 100}%`,
  }));

  if (!isVisible) return null;
  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.permissionCard}
        >
          <Feather name="camera" size={48} color={colors.primary} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Enable AI Vision
          </Text>
          <Text
            style={[styles.permissionSubText, { color: colors.textSecondary }]}
          >
            Camera access is required for real-time food recognition.
          </Text>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: colors.primary },
              shadows.medium,
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.btnText}>Allow Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelLink}>
            <Text style={{ color: colors.textSecondary }}>Not now</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });

      const result: AIScanResult = await GeminiAIService.scanFoodImage(
        photo.base64
      );

      if (result.success && result.detectedItems.length > 0) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        onItemsDetected(result.detectedItems);
        onClose();
      } else {
        throw new Error(result.error || 'No items recognized');
      }
    } catch (error: any) {
      Alert.alert(
        'AI Intelligence Alert',
        'Gemini is having trouble identifying these items. Try improving the lighting.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.fullScreen}
    >
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          {/* HEADER: Glassmorphic Info Bar */}
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconCircle}>
              <BlurView
                intensity={60}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <Feather name="chevron-left" size={24} color="white" />
            </TouchableOpacity>

            <BlurView intensity={40} tint="dark" style={styles.aiBadge}>
              <MaterialCommunityIcons
                name="auto-fix"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.aiBadgeText}>GEMINI PRO VISION v1.5</Text>
            </BlurView>

            <View style={{ width: 44 }} />
          </SafeAreaView>

          {/* SCANNER VIEWPORT */}
          <View style={styles.viewportContainer}>
            <View style={styles.targetFrame}>
              {/* Corner Accents */}
              <View
                style={[
                  styles.corner,
                  styles.topLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.topRight,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomRight,
                  { borderColor: colors.primary },
                ]}
              />

              {/* The Laser Animation */}
              {!isProcessing && (
                <Animated.View style={[styles.laser, laserStyle]}>
                  <LinearGradient
                    colors={['transparent', colors.primary, 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}

              {isProcessing && (
                <BlurView
                  intensity={90}
                  tint="dark"
                  style={styles.processingOverlay}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.processingText}>
                    ANALYZING INGREDIENTS...
                  </Text>
                </BlurView>
              )}
            </View>
          </View>

          {/* FOOTER: Glass Capture Controls */}
          <View style={styles.footer}>
            <BlurView
              intensity={isDark ? 80 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={styles.capturePanel}
            >
              <Text
                style={[styles.hint, { color: isDark ? 'white' : colors.text }]}
              >
                Center items in the frame for best results
              </Text>

              <TouchableOpacity
                style={[styles.captureBtn, { borderColor: colors.primary }]}
                onPress={handleCapture}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={[colors.primary, '#6366F1']}
                  style={styles.captureInner}
                >
                  <MaterialCommunityIcons
                    name="shimmer"
                    size={32}
                    color="white"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </CameraView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  aiBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  viewportContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetFrame: {
    width: width * 0.75,
    height: width * 0.75,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 4 },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  laser: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  processingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: { padding: 24, paddingBottom: 50 },
  capturePanel: {
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hint: { fontSize: 13, fontWeight: '600', marginBottom: 20, opacity: 0.8 },
  captureBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    padding: 4,
  },
  captureInner: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: { flex: 1, justifyContent: 'center', padding: 30 },
  permissionCard: {
    padding: 40,
    borderRadius: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  permissionText: { fontSize: 24, fontWeight: '900', marginTop: 24 },
  permissionSubText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
    marginBottom: 32,
  },
  btn: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  cancelLink: { marginTop: 20 },
});

/**
 * @file AIFoodScanner.tsx
 * @description high-performance AI vision interface.
 * Fixed: Explicit AIScanResult typing and memory management.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Internal Systems
import { GeminiAIService, AIScanResult } from '../services/GeminiAIService';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!isVisible) return null;

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Feather name="camera-off" size={64} color={colors.textSecondary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          AI Vision requires camera access to identify items.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.btnText}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={{ color: colors.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      // Fixed: Casting result to AIScanResult to ensure .success exists
      const result: AIScanResult = await GeminiAIService.scanFoodImage(
        photo.base64
      );

      if (result.success && result.detectedItems.length > 0) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        onItemsDetected(result.detectedItems);
      } else {
        throw new Error(result.error || 'No items recognized');
      }
    } catch (error: any) {
      Alert.alert(
        'Recognition Failed',
        'Gemini could not identify the items. Check lighting.'
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
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.aiLabel}>
              <Text style={styles.aiLabelText}>GEMINI AI ACTIVE</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.scannerContainer}>
            <View
              style={[
                styles.targetBox,
                { borderColor: isProcessing ? colors.primary : 'white' },
              ]}
            >
              {isProcessing && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>
                    Analyzing Ingredients...
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.hint}>Point at food to auto-detect</Text>
            <TouchableOpacity
              style={[styles.captureBtn, { borderColor: colors.primary }]}
              onPress={handleCapture}
              disabled={isProcessing}
            >
              <View
                style={[
                  styles.captureInner,
                  { backgroundColor: isProcessing ? 'transparent' : 'white' },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  closeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLabel: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  aiLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetBox: {
    width: Dimensions.get('window').width * 0.75,
    height: Dimensions.get('window').width * 0.75,
    borderWidth: 2,
    borderRadius: 40,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 40,
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontWeight: '700',
    fontSize: 14,
  },
  footer: { alignItems: 'center', marginBottom: 40 },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    padding: 4,
  },
  captureInner: { flex: 1, borderRadius: 36 },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 24,
  },
  btn: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 18 },
  btnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  cancelBtn: { marginTop: 24 },
});

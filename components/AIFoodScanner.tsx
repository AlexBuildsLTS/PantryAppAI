
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';

import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onClose: () => void;
  onItemsDetected: (base64: string) => void;
}

export default function AIFoodScanner({ onClose, onItemsDetected }: Props) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  /**
   * MODULE: BROWSER HARDWARE TRIGGER
   * Description: Modern browsers (Chrome/Safari) require a DIRECT user gesture.
   * This function bypasses the silent blocking of camera prompts.
   */
  const handleEnableCamera = async () => {
    try {
      const { granted, canAskAgain } = await requestPermission();
      if (!granted) {
        if (Platform.OS === 'web' && !canAskAgain) {
          Alert.alert(
            "Permission Blocked",
            "Camera access has been permanently blocked by your browser. Please check your site settings or permissions menu."
          );
        } else {
          Alert.alert(
            "Permission Required",
            "Camera access is required for AI Vision. Please grant permission when prompted."
          );
        }
      }
    } catch (error) {
      console.error("Camera permission request failed:", error);
      Alert.alert("Initialization Error", "Failed to initiate camera permission request. Ensure secure context (HTTPS/Localhost) on Web.");
    }
  };

  const handleCapture = async () => {
    if (isCapturing || !cameraRef.current) return;

    try {
      setIsCapturing(true);

      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7, // Optimized for AI processing speed
      });

      if (photo?.base64) {
        onItemsDetected(photo.base64);
      } else {
        console.warn("[CAPTURE WARNING]: Captured photo did not contain base64 data.");
        Alert.alert("Capture Incomplete", "Image buffer received without data payload.");
      }
    } catch (error) {
      console.error("[CAMERA HARDWARE ERROR]:", error);
      Alert.alert("Capture Failed", "Failed to capture image. Ensure the camera is fully initialized.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  // VIEW 1: Permission Guard (Initialization Required)
  if (!permission.granted) {
    return (
      <Modal visible animationType="fade" transparent={false}>
        <View style={[styles.permContainer, { backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="camera-off" size={84} color={colors.error} />
          <Text style={[styles.permTitle, { color: colors.text }]}>Hardware Access Restricted</Text>
          <Text style={[styles.permSub, { color: colors.textSecondary }]}>
            AI Vision requires direct camera access. Please enable permissions via your browser settings or click below to attempt re-initialization.
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={handleEnableCamera}
          >
            <Text style={styles.btnText}>REQUEST CAMERA PERMISSION</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>DISMISS SCANNER</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // VIEW 2: Active Camera Interface
  return (
    <Modal visible animationType="slide" transparent={false}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.overlay}>
            <View style={styles.topActions}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI VISION ACTIVE</Text>
              </View>
            </View>

            <View style={styles.viewfinder}>
              {/* Intelligent Viewport Corners */}
              <View style={[styles.corner, styles.tl, { borderColor: colors.primary, shadowColor: 'white', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 }]} />
              <View style={[styles.corner, styles.tr, { borderColor: colors.primary, shadowColor: 'white', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 }]} />
              <View style={[styles.corner, styles.bl, { borderColor: colors.primary, shadowColor: 'white', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 }]} />
              <View style={[styles.corner, styles.br, { borderColor: colors.primary, shadowColor: 'white', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 }]} />
            </View>

            <BlurView intensity={30} tint="dark" style={styles.controlBar}>
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <TouchableOpacity onPress={handleCapture} style={[styles.shutter, { borderColor: colors.primary }]}>
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              )}
              <Text style={styles.shutterLabel}>TAP TO ANALYZE PACKAGING</Text>
            </BlurView>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permTitle: { fontSize: 26, fontWeight: '900', marginTop: 30, textAlign: 'center' },
  permSub: { textAlign: 'center', marginTop: 15, lineHeight: 22, opacity: 0.7, paddingHorizontal: 20 },
  btn: { marginTop: 40, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 24, elevation: 8 },
  btnText: { color: 'white', fontWeight: '900', letterSpacing: 1.5 },
  cancelBtn: { marginTop: 30, padding: 10 },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 60 },
  topActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  closeBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  aiBadge: { marginLeft: 20, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  aiBadgeText: { color: 'white', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  viewfinder: { width: 280, height: 280, alignSelf: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 45, height: 45, borderWidth: 6 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 24 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 24 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 24 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 24 },
  controlBar: { height: 180, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' },
  shutter: { width: 88, height: 88, borderRadius: 44, borderWidth: 6, padding: 4, justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: '100%', height: '100%', borderRadius: 42, backgroundColor: 'white', opacity: 0.95 },
  shutterLabel: { color: 'white', marginTop: 15, fontSize: 10, fontWeight: '900', letterSpacing: 2 }
});
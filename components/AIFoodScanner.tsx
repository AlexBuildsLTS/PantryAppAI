/**
 * @file components/AIFoodScanner.tsx
 * @description DEFINITIVE HARDWARE BRIDGE.
 * FIXES: Browser permission blocking and hardware initialization.
 */

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
import { CookingModeModal } from './CookingModal';
import { RecipeCard } from './RecipeCard';

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

  // Trigger permission request immediately on mount for Web
  useEffect(() => {
    if (Platform.OS === 'web' && !permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) return;

    try {
      setIsCapturing(true);
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo?.base64) {
        onItemsDetected(photo.base64);
      }
    } catch (error) {
      Alert.alert("Hardware Error", "Could not capture image from sensor.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (!permission.granted) {
    return (
      <Modal visible animationType="fade">
        <View style={[styles.permContainer, { backgroundColor: colors.background }]}>
          <Feather name="camera" size={64} color={colors.primary} />
          <Text style={[styles.permTitle, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.permSub, { color: colors.textSecondary }]}>
            Enable the camera to use AI Vision. If no popup appears, check your browser address bar for a blocked icon.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={async () => {
              const res = await requestPermission();
              if (!res.granted) {
                Alert.alert("Blocked", "Camera access was denied by the browser.");
              }
            }}
          >
            <Text style={styles.btnText}>ENABLE AI VISION</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" transparent={false}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <Feather name="x" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.title}>AI SCANNER</Text>
            </View>

            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.tl, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.tr, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bl, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.br, { borderColor: colors.primary }]} />
            </View>

            <BlurView intensity={30} tint="dark" style={styles.bottomBar}>
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <TouchableOpacity onPress={handleCapture} style={[styles.shutter, { borderColor: colors.primary }]}>
                  <MaterialCommunityIcons name="shimmer" size={32} color="white" />
                </TouchableOpacity>
              )}
            </BlurView>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permTitle: { fontSize: 24, fontWeight: '900', marginTop: 20 },
  permSub: { textAlign: 'center', marginTop: 12, opacity: 0.7, lineHeight: 20 },
  btn: { marginTop: 30, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20 },
  btnText: { color: 'white', fontWeight: '900', letterSpacing: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30 },
  iconBtn: { padding: 10 },
  title: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 4, marginLeft: 20 },
  viewfinder: { width: 280, height: 280, alignSelf: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  bottomBar: { height: 140, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, borderRadius: 40, overflow: 'hidden' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }
});
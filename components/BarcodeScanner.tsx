import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

export function BarcodeScanner({ visible, onClose, onBarcodeScanned }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setScanned(false);
      startScanAnimation();
    }
  }, [visible]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanAnimation, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onBarcodeScanned(data);
    }
  };

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <BlurView intensity={20} style={styles.overlay}>
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="barcode-scan" size={64} color="#6B7280" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>We need camera access to scan barcodes.</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Grant Permission</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView style={styles.camera} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} enableTorch={flashEnabled} barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "upc_e"] }}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconButton} onPress={onClose}><Feather name="x" size={24} color="#FFFFFF" /></TouchableOpacity>
              <Text style={styles.title}>Scan Barcode</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setFlashEnabled(!flashEnabled)}>
                {flashEnabled ? <Feather name="zap-off" size={24} color="#FFFFFF" /> : <Feather name="zap" size={24} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
                <Animated.View style={[ styles.scanLine, { transform: [{ translateY: scanAnimation.interpolate({ inputRange: [0, 1], outputRange: [-10, 240] }) }] } ]} />
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  scanArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFFFFF', borderWidth: 5, borderRadius: 8 },
  topLeft: { top: -5, left: -5, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -5, right: -5, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -5, left: -5, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -5, right: -5, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  permissionTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 24, marginBottom: 16, textAlign: 'center' },
  permissionText: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  permissionButton: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  cancelButton: { paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
});
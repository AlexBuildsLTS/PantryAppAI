/**
 * @component BarcodeScanner
 * High-performance camera-based barcode scanner for rapid product entry.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult, BarcodeType } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (data: string) => void;
}

const SUPPORTED_BARCODE_TYPES: BarcodeType[] = ['ean13', 'upc_a', 'ean8', 'upc_e'];

const BarcodeScanner: React.FC<BarcodeScannerProps> = React.memo(({ visible, onClose, onBarcodeScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset scanned state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setScanned(false);
      setError(null);
    }
  }, [visible]);

  const handleScan = useCallback((result: BarcodeScanningResult) => {
    if (!scanned && result.data) {
      try {
        setScanned(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBarcodeScanned(result.data);
        onClose();
      } catch (err) {
        console.error('Error processing scanned barcode:', err);
        setError('Failed to process barcode. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [scanned, onBarcodeScanned, onClose]);

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermission();
      if (!result?.granted) {
        setError('Camera permission denied. Please enable camera access in settings.');
      }
    } catch (err) {
      console.error('Error requesting camera permission:', err);
      setError('Failed to request camera permission.');
    }
  };

  if (permission === null) {
    // Permission is still loading
    return (
      <Modal visible={visible} transparent>
        <BlurView intensity={40} className="items-center justify-center flex-1 p-6">
          <View className="bg-surface p-8 rounded-[40px] items-center">
            <Text className="text-xl font-bold text-center text-white">Loading Camera...</Text>
          </View>
        </BlurView>
      </Modal>
    );
  }

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent>
        <BlurView intensity={40} className="items-center justify-center flex-1 p-6">
          <View className="bg-surface p-8 rounded-[40px] items-center">
            <Feather name="camera" size={48} color="#666" />
            <Text className="mt-4 text-xl font-bold text-center text-white">
              Camera Access Needed
            </Text>
            {permission.canAskAgain ? (
              <TouchableOpacity
                className="px-8 py-4 mt-6 bg-primary rounded-xl"
                onPress={handlePermissionRequest}
                accessibilityLabel="Request camera permission"
              >
                <Text className="font-bold text-white">Enable Camera</Text>
              </TouchableOpacity>
            ) : (
              <Text className="mt-4 text-center text-white/80">
                Camera permission is denied. Please enable it in device settings.
              </Text>
            )}
            {error && <Text className="mt-4 text-red-400 text-center">{error}</Text>}
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <CameraView
        className="flex-1"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: SUPPORTED_BARCODE_TYPES }}
      >
        <SafeAreaView className="justify-between flex-1 p-6">
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-12 h-12 rounded-full bg-black/50"
            accessibilityLabel="Close scanner"
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center justify-center w-full h-64 border-2 border-primary/50 rounded-3xl bg-black/10">
            <View className="w-full h-1 shadow-lg bg-primary/80 shadow-primary" />
            <Text className="mt-2 text-sm text-center text-white/80">
              Position barcode within the frame
            </Text>
          </View>

          <Text className="mb-10 font-bold text-center text-white/60">
            Scan product barcode
          </Text>

          {error && (
            <View className="absolute bottom-20 left-6 right-6 bg-red-500 p-4 rounded-xl">
              <Text className="text-white text-center">{error}</Text>
            </View>
          )}
        </SafeAreaView>
      </CameraView>
    </Modal>
  );
});

BarcodeScanner.displayName = 'BarcodeScanner';

export { BarcodeScanner };

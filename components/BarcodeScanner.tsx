/**
 * @component BarcodeScanner
 * High-performance camera-based barcode scanner for rapid product entry.
 */
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function BarcodeScanner({ visible, onClose, onBarcodeScanned }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScan = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onBarcodeScanned(data);
      onClose();
    }
  };

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent>
        <BlurView
          intensity={40}
          className="items-center justify-center flex-1 p-6"
        >
          <View className="bg-surface p-8 rounded-[40px] items-center">
            <Feather name="camera" size={48} color="#666" />
            <Text className="mt-4 text-xl font-bold text-center text-white">
              Camera Access Needed
            </Text>
            <TouchableOpacity
              className="px-8 py-4 mt-6 bg-primary rounded-xl"
              onPress={requestPermission}
            >
              <Text className="font-bold text-white">Enable Camera</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <CameraView
        className="flex-1"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'upc_a'] }}
      >
        <SafeAreaView className="justify-between flex-1 p-6">
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-12 h-12 rounded-full bg-black/50"
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center justify-center w-full h-64 border-2 border-primary/50 rounded-3xl bg-black/10">
            <View className="w-full h-1 shadow-lg bg-primary/80 shadow-primary" />
          </View>

          <Text className="mb-10 font-bold text-center text-white/60">
            Scan product barcode
          </Text>
        </SafeAreaView>
      </CameraView>
    </Modal>
  );
}

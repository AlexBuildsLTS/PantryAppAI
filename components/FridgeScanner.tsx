import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FridgeScannerProps {
  visible: boolean;
  onClose: () => void;
  onItemsAdded: () => void;
}

interface ScannedItem {
  name: string;
  quantity?: number;
  expiration_date?: string; // AI might return this
  category?: string;
  // Add other fields as needed based on AI response
}

const CAMERA_OPTIONS = {
  base64: true,
  quality: 0.7, // Slightly higher quality for better AI analysis
};

export function FridgeScanner({ visible, onClose, onItemsAdded }: FridgeScannerProps) {
  const { user, household } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = React.useRef<CameraView>(null);

  const processImage = useCallback(async (base64Image: string) => {
    const { data, error } = await supabase.functions.invoke('pantry-ai-scanner', {
      body: { imageBase64: base64Image },
    });

    if (error) throw error;

    // Validate data structure
    if (!data?.items || !Array.isArray(data.items)) {
      throw new Error('Invalid response from AI scanner');
    }

    return data.items as ScannedItem[];
  }, []);

  const saveItemsToDB = useCallback(async (items: ScannedItem[]) => {
    if (!user || !household) {
      throw new Error('User not authenticated or no household found');
    }

    const itemsWithMetadata = items.map(item => ({
      name: item.name,
      category: item.category,
      user_id: user.id,
      household_id: household.id,
      status: 'fresh',
      quantity: item.quantity ?? 1,
      initial_quantity: item.quantity ?? 1,
      unit: 'pcs',
      purchase_date: new Date().toISOString(),
      expiry_date: item.expiration_date,
    }));

    const { error: insertError } = await supabase
      .from('pantry_items')
      .insert(itemsWithMetadata as any);

    if (insertError) throw insertError;
  }, [user, household]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || analyzing || !user || !household) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Provide haptic feedback for better UX
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const photo = await cameraRef.current.takePictureAsync(CAMERA_OPTIONS);

      if (!photo?.base64) {
        throw new Error('Failed to capture image');
      }

      // Process the image with AI
      const scannedItems = await processImage(photo.base64);

      // Save scanned items to database
      await saveItemsToDB(scannedItems);

      // Provide success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      onItemsAdded();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('FridgeScanner Error:', err);

      // Optionally show alert for user feedback
      Alert.alert('Scan Failed', errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, onClose, onItemsAdded, processImage, saveItemsToDB]);

  return (
    <Modal visible={visible} animationType="slide">
      <CameraView ref={cameraRef} className="flex-1">
        <View className="justify-between flex-1 p-8 bg-black/40">
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-12 h-12 rounded-full bg-black/50"
            accessibilityLabel="Close scanner"
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center">
            <View className="items-center justify-center overflow-hidden border-2 w-72 h-72 border-primary rounded-3xl">
              {analyzing && (
                <BlurView
                  intensity={50}
                  className="absolute inset-0 items-center justify-center"
                >
                  <ActivityIndicator color="#22C55E" size="large" />
                  <Text className="mt-4 font-bold text-white">
                    AI Analyzing Fridge...
                  </Text>
                </BlurView>
              )}
            </View>
            <Text className="mt-6 text-center text-white/70">
              Frame your food items clearly
            </Text>
            {error && (
              <Text className="mt-2 text-center text-red-400">
                Error: {error}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={takePicture}
            disabled={analyzing}
            className="items-center self-center justify-center w-20 h-20 border-4 rounded-full bg-primary border-white/20"
            accessibilityLabel="Take picture and scan"
          >
            <View className="w-16 h-16 border-2 rounded-full border-white/50" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </Modal>
  );
}

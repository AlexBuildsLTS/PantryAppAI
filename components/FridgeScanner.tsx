import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { supabase } from '@/services/supabase';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function FridgeScanner({ visible, onClose, onItemsAdded }: any) {
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = React.useRef<any>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      setAnalyzing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      try {
        const { data, error } = await supabase.functions.invoke(
          'pantry-ai-scanner',
          {
            body: { imageBase64: photo.base64 },
          }
        );

        if (error) throw error;

        // Save items to DB
        await supabase
          .from('pantry_items')
          .insert(
            data.items.map((i: any) => ({
              ...i,
              added_by: supabase.auth.getUser(),
            }))
          );

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onItemsAdded();
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <CameraView ref={cameraRef} className="flex-1">
        <View className="justify-between flex-1 p-8 bg-black/40">
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-12 h-12 rounded-full bg-black/50"
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
          </View>

          <TouchableOpacity
            onPress={takePicture}
            disabled={analyzing}
            className="items-center self-center justify-center w-20 h-20 border-4 rounded-full bg-primary border-white/20"
          >
            <View className="w-16 h-16 border-2 rounded-full border-white/50" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </Modal>
  );
}

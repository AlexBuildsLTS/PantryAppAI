import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  location: 'pantry' | 'fridge' | 'freezer';
  expiry_days: number;
}

export const AIFoodScanner = ({
  onItemsAdded,
}: {
  onItemsAdded: () => void;
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<ScannedItem[]>([]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true,
      quality: 0.7, // Optimized size for AI upload
    });

    if (!result.canceled) {
      setPreviewImage(result.assets[0].uri);
      processImage(result.assets[0].base64!);
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data, error } = await supabase.functions.invoke(
        'pantry-ai-scanner',
        {
          body: { imageBase64: base64, userId: user?.id },
        }
      );

      if (error) throw error;
      setDetectedItems(data.items);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Scanner Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAllItems = async () => {
    setLoading(true);
    try {
      const { data: household } = await supabase
        .from('household_members')
        .select('household_id')
        .single();

      const itemsToInsert = detectedItems.map((item) => ({
        ...item,
        household_id: household?.household_id,
        added_by: user?.id,
        expiry_date: new Date(
          Date.now() + item.expiry_days * 86400000
        ).toISOString(),
      }));

      const { error } = await supabase
        .from('pantry_items')
        .insert(itemsToInsert);
      if (error) throw error;

      Alert.alert('Success', `${detectedItems.length} items added!`);
      setDetectedItems([]);
      setPreviewImage(null);
      onItemsAdded();
    } catch (err: any) {
      Alert.alert('Save Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-6">
      {!previewImage ? (
        <TouchableOpacity
          onPress={handlePickImage}
          className="bg-primary h-40 rounded-[30px] items-center justify-center border-2 border-dashed border-white/20"
        >
          <Feather name="camera" size={40} color="white" />
          <Text className="mt-2 font-bold text-white">
            Scan Fridge or Receipt
          </Text>
        </TouchableOpacity>
      ) : (
        <BlurView
          intensity={30}
          className="rounded-[30px] overflow-hidden bg-white/5 border border-white/10 p-4"
        >
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: previewImage }}
              className="w-20 h-20 rounded-2xl"
            />
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-white">AI Detection</Text>
              <Text className="text-text-secondary">
                {loading
                  ? 'Analyzing food...'
                  : `${detectedItems.length} items found`}
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#22C55E" size="large" className="my-6" />
          ) : (
            <ScrollView className="mb-4 max-h-60">
              {detectedItems.map((item, i) => (
                <View
                  key={i}
                  className="flex-row justify-between py-2 border-b border-white/5"
                >
                  <Text className="font-medium text-white">{item.name}</Text>
                  <Text className="font-bold text-primary-dark">
                    +{item.expiry_days}d
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              className="items-center flex-1 p-4 bg-white/10 rounded-2xl"
            >
              <Text className="text-white">Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveAllItems}
              className="items-center p-4 flex-2 bg-primary rounded-2xl"
            >
              <Text className="font-bold text-white">Save All</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </View>
  );
};

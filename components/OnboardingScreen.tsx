import React, { useState, useRef } from 'react';
import {
  _View as View,
  Text,
  Dimensions,
  Pressable,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    id: '1',
    title: 'Smart Pantry',
    desc: 'Enterprise tracking for your food inventory.',
    icon: 'package',
    color: ['#22C55E', '#16A34A'],
  },
  {
    id: '2',
    title: 'AI Vision',
    desc: 'Scan receipts and fridges with Gemini AI.',
    icon: 'camera',
    color: ['#3B82F6', '#2563EB'],
  },
  {
    id: '3',
    title: 'Zero Waste',
    desc: 'Get smart notifications before food expires.',
    icon: 'bell',
    color: ['#F59E0B', '#D97706'],
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Use <any> for the ref to prevent TS conflicts with Animated.FlatList
  const flatListRef = useRef<any>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-black">
      <View className="flex-row justify-between p-6">
        <Text className="text-2xl font-bold text-primary">Pantry Pal</Text>
        <Pressable onPress={onComplete} className="pressed:opacity-80 p-2">
          <Text className="font-bold text-text-secondary">Skip</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) =>
          setCurrentStep(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center justify-center px-10">
            <LinearGradient
              colors={item.color as readonly [string, string, ...string[]]}
              className="w-32 h-32 rounded-[40px] items-center justify-center mb-10 shadow-xl shadow-primary/20"
            >
              <Feather name={item.icon as any} size={48} color="white" />
            </LinearGradient>
            <Text className="mb-4 text-3xl font-bold text-center text-white">
              {item.title}
            </Text>
            <Text className="text-lg leading-6 text-center text-text-secondary">
              {item.desc}
            </Text>
          </View>
        )}
      />

      <View className="p-10">
        <Pressable
          onPress={handleNext}
          className="flex-row items-center justify-center h-16 bg-primary rounded-2xl pressed:opacity-80"
        >
          <Text className="mr-2 text-lg font-bold text-white">
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Feather name="arrow-right" size={20} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

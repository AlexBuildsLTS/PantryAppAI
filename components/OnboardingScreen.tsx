import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Feather>['name'] | React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconSet: 'Feather' | 'MaterialCommunityIcons';
  image: string;
  gradient: string[];
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  { id: '1', title: 'Smart Food Management', description: 'Keep track of all your food items with expiration dates, locations, and quantities.', iconName: 'package', iconSet: 'Feather', image: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg', gradient: ['#22C55E', '#16A34A'] },
  { id: '2', title: 'AI-Powered Recognition', description: 'Use your camera to automatically identify and add multiple food items at once.', iconName: 'brain', iconSet: 'MaterialCommunityIcons', image: 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg', gradient: ['#3B82F6', '#2563EB'] },
  { id: '3', title: 'Smart Notifications', description: 'Get timely alerts before your food expires and never waste food again.', iconName: 'bell', iconSet: 'Feather', image: 'https://images.pexels.com/photos/5938567/pexels-photo-5938567.jpeg', gradient: ['#F59E0B', '#D97706'] },
  { id: '4', title: 'Analytics & Insights', description: 'Track your food waste reduction and see your positive environmental impact.', iconName: 'bar-chart-2', iconSet: 'Feather', image: 'https://images.pexels.com/photos/6347919/pexels-photo-6347919.jpeg', gradient: ['#8B5CF6', '#7C3AED'] },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    } else {
      onComplete();
    }
  };

  const renderStep = ({ item }: { item: OnboardingStep }) => {
    const Icon = item.iconSet === 'Feather' ? Feather : MaterialCommunityIcons;
    return (
      <View style={[styles.stepContainer, { width }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.stepImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
          <View style={styles.iconContainer}><LinearGradient colors={item.gradient as any} style={styles.iconGradient}><Icon name={item.iconName as any} size={32} color="#FFFFFF" /></LinearGradient></View>
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingSteps.map((_, index) => {
        const opacity = scrollX.interpolate({ inputRange: [(index - 1) * width, index * width, (index + 1) * width], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
        const scale = scrollX.interpolate({ inputRange: [(index - 1) * width, index * width, (index + 1) * width], outputRange: [0.8, 1.2, 0.8], extrapolate: 'clamp' });
        return <Animated.View key={index} style={[ styles.paginationDot, { opacity, transform: [{ scale }], backgroundColor: theme.colors.primary } ]} />;
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: theme.colors.primary }]}>Pantry Pal</Text>
        <TouchableOpacity onPress={onComplete}><Text style={[styles.skipButton, { color: theme.colors.textSecondary }]}>Skip</Text></TouchableOpacity>
      </View>
      <Animated.FlatList
        ref={flatListRef} data={onboardingSteps} renderItem={renderStep} keyExtractor={(item) => item.id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(event) => { setCurrentStep(Math.round(event.nativeEvent.contentOffset.x / width)); }}
      />
      {renderPagination()}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient colors={onboardingSteps[currentStep].gradient as any} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>{currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}</Text>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  logo: { fontSize: 24, fontWeight: '700' },
  skipButton: { fontSize: 16, fontWeight: '600' },
  stepContainer: { flex: 1, paddingHorizontal: 20 },
  imageContainer: { height: 300, borderRadius: 20, overflow: 'hidden', marginBottom: 40, position: 'relative' },
  stepImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  iconContainer: { position: 'absolute', bottom: 20, right: 20 },
  iconGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { alignItems: 'center', paddingHorizontal: 20 },
  stepTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  stepDescription: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 8 },
  paginationDot: { width: 8, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 20, paddingBottom: 20 },
  nextButton: { borderRadius: 16, overflow: 'hidden' },
  nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  nextButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
});
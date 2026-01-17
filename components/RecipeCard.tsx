import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// --- Constants and Configuration (Readability/Maintainability Improvement) ---

const CARD_CONFIG = {
  WIDTH_CLASS: 'w-72',
  FALLBACK_IMAGE_URL: 'https://via.placeholder.com/400x160?text=No+Image',
};

const ICON_CONFIG = {
  SIZE: 14,
  CLOCK_COLOR: '#94A3B8',
  STAR_COLOR: '#F59E0B',
};

// --- TypeScript Interfaces ---

interface Recipe {
  title: string;
  image: string;
  cookTime: number;
  rating: number;
  availableIngredients: number;
  ingredients: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

// --- Helper Components (Readability Improvement) ---

interface RecipeStatProps {
  iconName: 'clock' | 'star';
  value: number;
  unit?: string;
  color: string;
  textClass: string;
}

const RecipeStat = React.memo<RecipeStatProps>(({ iconName, value, unit = '', color, textClass }) => (
  <View className="flex-row items-center">
    <Feather name={iconName} size={ICON_CONFIG.SIZE} color={color} />
    <Text className={`ml-1 text-xs ${textClass}`}>
      {/* Error Handling: Nullish value handled */}
      {value ?? 0}{unit}
    </Text>
  </View>
));
RecipeStat.displayName = 'RecipeStat';


const MatchBadge = React.memo<{ percentage: number }>(({ percentage }) => (
  <View className="absolute top-3 right-3">
    <BlurView
      intensity={40}
      className="px-3 py-1 overflow-hidden border rounded-full bg-primary/20 border-primary/30"
    >
      <Text className="text-xs font-bold text-primary">
        {percentage}% Match
      </Text>
    </BlurView>
  </View>
));
MatchBadge.displayName = 'MatchBadge';


const InventoryBar = React.memo<{ percentage: number }>(({ percentage }) => (
  <>
    <View
      className="bg-white/5 h-1.5 rounded-full overflow-hidden"
      accessibilityLabel={`Inventory coverage: ${percentage}%`}
    >
      <View
        className="h-full bg-primary"
        style={{ width: `${percentage}%` }}
      />
    </View>
    <Text className="text-white/40 text-[10px] mt-2 font-bold uppercase">
      Inventory coverage
    </Text>
  </>
));
InventoryBar.displayName = 'InventoryBar';

// --- Core Logic (Best Practices/Error Handling) ---

/**
 * Helper function to calculate ingredient match percentage.
 * Handles the edge case where there are no ingredients.
 */
const calculateMatchPercentage = (available: number, total: number): number => {
  if (total === 0) {
    // Edge case handling: Returns 0 if there are no ingredients to match against.
    return 0;
  }
  return Math.min(100, Math.round((available / total) * 100));
};

const RecipeCardComponent = ({ recipe, onPress }: RecipeCardProps) => {
  // Readability: Destructure recipe for cleaner component body
  const { title, image, cookTime, rating, availableIngredients, ingredients } = recipe;

  const [imageError, setImageError] = useState(false);

  // Performance: Keep calculation memoized and use the extracted helper
  const matchPercentage = useMemo(() => {
    return calculateMatchPercentage(availableIngredients, ingredients.length);
  }, [availableIngredients, ingredients.length]);

  // Performance/Best Practice: Use useCallback for stable function reference
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  // Performance/Best Practice: Use useCallback for stable function reference
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Error Handling/Best Practice: Memoize image source logic and include fallback for empty image string
  const imageSource = useMemo(() =>
    imageError || !image
      ? { uri: CARD_CONFIG.FALLBACK_IMAGE_URL }
      : { uri: image },
    [imageError, image]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className={`bg-card ${CARD_CONFIG.WIDTH_CLASS} mr-4 rounded-[30px] overflow-hidden border border-white/5 shadow-2xl`}
      accessibilityLabel={`Recipe: ${title}, ${matchPercentage}% ingredient match`}
      accessibilityRole="button"
    >
      {/* Image Area */}
      <View className="relative h-40">
        <Image
          source={imageSource}
          className="w-full h-full"
          onError={handleImageError}
          accessible={true}
          accessibilityLabel={`Image of ${title}`}
        />
        <MatchBadge percentage={matchPercentage} />
      </View>

      {/* Details Area */}
      <View className="p-5">
        <Text className="mb-2 text-lg font-bold text-white" numberOfLines={1}>
          {title || 'Untitled Recipe'} {/* Error Handling: Fallback title */}
        </Text>

        {/* Stats */}
        <View className="flex-row items-center gap-4 mb-4">
          <RecipeStat
            iconName="clock"
            value={cookTime}
            unit="m"
            color={ICON_CONFIG.CLOCK_COLOR}
            textClass="text-text-tertiary"
          />
          <RecipeStat
            iconName="star"
            value={rating}
            color={ICON_CONFIG.STAR_COLOR}
            textClass="text-warning"
          />
        </View>

        {/* Inventory Bar */}
        <InventoryBar percentage={matchPercentage} />
      </View>
    </TouchableOpacity>
  );
};

RecipeCardComponent.displayName = 'RecipeCard';

export const RecipeCard = React.memo(RecipeCardComponent);

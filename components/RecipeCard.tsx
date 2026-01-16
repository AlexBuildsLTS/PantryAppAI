import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Constants for better maintainability
const CARD_WIDTH = 'w-72';
const ICON_SIZE = 14;
const CLOCK_COLOR = '#94A3B8';
const STAR_COLOR = '#F59E0B';

// TypeScript interfaces
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

const RecipeCardComponent = ({ recipe, onPress }: RecipeCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Memoized calculation to avoid recomputation on re-renders
  const matchPercentage = useMemo(() => {
    if (recipe.ingredients.length === 0) return 0;
    return Math.min(100, Math.round((recipe.availableIngredients / recipe.ingredients.length) * 100));
  }, [recipe.availableIngredients, recipe.ingredients.length]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Fallback image source (you can replace with a local asset if available)
  const imageSource = imageError ? { uri: 'https://via.placeholder.com/400x160?text=No+Image' } : { uri: recipe.image };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className={`bg-card ${CARD_WIDTH} mr-4 rounded-[30px] overflow-hidden border border-white/5 shadow-2xl`}
      accessibilityLabel={`Recipe: ${recipe.title}, ${matchPercentage}% ingredient match`}
      accessibilityRole="button"
    >
      <View className="relative h-40">
        <Image
          source={imageSource}
          className="w-full h-full"
          onError={handleImageError}
          accessible={true}
          accessibilityLabel={`Image of ${recipe.title}`}
        />
        <View className="absolute top-3 right-3">
          <BlurView
            intensity={40}
            className="px-3 py-1 overflow-hidden border rounded-full bg-primary/20 border-primary/30"
          >
            <Text className="text-xs font-bold text-primary">
              {matchPercentage}% Match
            </Text>
          </BlurView>
        </View>
      </View>

      <View className="p-5">
        <Text className="mb-2 text-lg font-bold text-white" numberOfLines={1}>
          {recipe.title || 'Untitled Recipe'}
        </Text>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <Feather name="clock" size={ICON_SIZE} color={CLOCK_COLOR} />
            <Text className="ml-1 text-xs text-text-tertiary">
              {recipe.cookTime ?? 0}m
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="star" size={ICON_SIZE} color={STAR_COLOR} />
            <Text className="ml-1 text-xs text-warning">{recipe.rating ?? 0}</Text>
          </View>
        </View>

        <View
          className="bg-white/5 h-1.5 rounded-full overflow-hidden"
          accessibilityLabel={`Inventory coverage: ${matchPercentage}%`}
        >
          <View
            className="h-full bg-primary"
            style={{ width: `${matchPercentage}%` }}
          />
        </View>
        <Text className="text-white/40 text-[10px] mt-2 font-bold uppercase">
          Inventory coverage
        </Text>
      </View>
    </TouchableOpacity>
  );
};

RecipeCardComponent.displayName = 'RecipeCard';

export const RecipeCard = React.memo(RecipeCardComponent);

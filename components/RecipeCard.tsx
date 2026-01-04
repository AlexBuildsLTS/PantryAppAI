import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function RecipeCard({ recipe, onPress }: any) {
  const matchPercentage = Math.round(
    (recipe.availableIngredients / recipe.ingredients.length) * 100
  );

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.9}
      className="bg-card w-72 mr-4 rounded-[30px] overflow-hidden border border-white/5 shadow-2xl"
    >
      <View className="relative h-40">
        <Image source={{ uri: recipe.image }} className="w-full h-full" />
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
          {recipe.title}
        </Text>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <Feather name="clock" size={14} color="#94A3B8" />
            <Text className="ml-1 text-xs text-text-tertiary">
              {recipe.cookTime}m
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="star" size={14} color="#F59E0B" />
            <Text className="ml-1 text-xs text-warning">{recipe.rating}</Text>
          </View>
        </View>

        <View className="bg-white/5 h-1.5 rounded-full overflow-hidden">
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
}

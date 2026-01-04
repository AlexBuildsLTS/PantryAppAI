/**
 * @module RecipesScreen
 * Enterprise-grade recipe orchestration engine.
 * Fetches personalized meal suggestions based on real-time pantry inventory
 * using Supabase Edge Functions and Google Gemini AI.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function RecipesScreen() {
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  // 1. Orchestrated Data Fetching
  // Calls the 'gemini-recipes' function which handles inventory-to-AI logic
  const {
    data: recipes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ai-recipes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gemini-recipes');
      if (error) throw error;
      return data.recipes;
    },
    // Prevent constant re-fetching to optimize AI costs
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenRecipe = (recipe: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRecipe(recipe);
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        className="flex-1 px-6 pt-16"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#22C55E"
          />
        }
      >
        {/* HEADER SECTION */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="auto-fix" size={20} color="#22C55E" />
            <Text className="text-primary font-bold uppercase tracking-widest text-[10px]">
              AI Powered
            </Text>
          </View>
          <Text className="mt-1 text-4xl font-black text-white">Chef AI</Text>
          <Text className="mt-2 text-sm leading-5 text-white/40">
            Generating custom recipes based on your unique pantry inventory...
          </Text>
        </View>

        {/* LOADING STATE: BENTO SKELETON */}
        {isLoading ? (
          <View className="gap-4">
            <View className="h-48 bg-white/5 rounded-[40px] animate-pulse" />
            <View className="flex-row gap-4">
              <View className="flex-1 h-32 bg-white/5 rounded-[35px]" />
              <View className="flex-1 h-32 bg-white/5 rounded-[35px]" />
            </View>
            <View className="h-48 bg-white/5 rounded-[40px]" />
          </View>
        ) : (
          <View className="pb-20">
            {recipes?.length > 0 ? (
              recipes.map((recipe: any, index: number) => (
                <RecipeCard
                  key={index}
                  recipe={recipe}
                  onPress={() => handleOpenRecipe(recipe)}
                />
              ))
            ) : (
              <EmptyPantryState />
            )}
          </View>
        )}
      </ScrollView>

      {/* RECIPE DETAIL MODAL (Senior Feature) */}
      <RecipeDetailModal
        isVisible={!!selectedRecipe}
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </View>
  );
}

/**
 * @component RecipeCard
 * Bento-style recipe card with high-precision information density.
 */
const RecipeCard = ({ recipe, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-[#161616] mb-5 rounded-[35px] border border-white/5 overflow-hidden"
  >
    <View className="p-6">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text
            className="text-xl font-bold leading-7 text-white"
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
          <View className="flex-row items-center gap-3 mt-3">
            <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full">
              <Feather name="clock" size={12} color="#22C55E" />
              <Text className="ml-1 text-xs font-bold text-white/80">
                {recipe.time}
              </Text>
            </View>
            <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full">
              <MaterialCommunityIcons
                name="chef-hat"
                size={12}
                color="#F59E0B"
              />
              <Text className="ml-1 text-xs font-bold text-white/80">
                {recipe.difficulty}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-center justify-center w-12 h-12 shadow-lg bg-primary rounded-2xl shadow-primary/20">
          <Feather name="chevron-right" size={24} color="white" />
        </View>
      </View>

      {/* MISSING INGREDIENTS ALERT (Contextual Utility) */}
      {recipe.missing?.length > 0 && (
        <BlurView
          intensity={10}
          className="bg-orange-500/10 p-4 rounded-[25px] border border-orange-500/20"
        >
          <Text className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">
            Shopping List Needed
          </Text>
          <Text className="text-xs italic text-white/60">
            Missing: {recipe.missing.join(', ')}
          </Text>
        </BlurView>
      )}
    </View>
  </TouchableOpacity>
);

/**
 * @component RecipeDetailModal
 * Full-screen glassmorphism detail view.
 */
const RecipeDetailModal = ({ isVisible, recipe, onClose }: any) => {
  if (!recipe) return null;
  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <BlurView intensity={60} tint="dark" className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 bg-[#0A0A0A]/90 mt-20 rounded-t-[50px] border-t border-white/10 p-8">
            <TouchableOpacity
              onPress={onClose}
              className="items-center self-end justify-center w-12 h-12 mb-4 rounded-full bg-white/10"
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-6 text-3xl font-black text-white">
                {recipe.title}
              </Text>

              <Text className="mb-4 text-lg font-bold text-primary">
                The Logic
              </Text>
              <Text className="text-base leading-6 text-white/60">
                Chef AI analyzed your {recipe.time} window and inventory. This
                dish maximizes your current supplies while minimizing prep
                difficulty.
              </Text>

              <View className="h-px my-8 bg-white/5" />

              <TouchableOpacity
                className="bg-primary h-16 rounded-[20px] items-center justify-center shadow-xl shadow-primary/30"
                onPress={() =>
                  Alert.alert(
                    'Coming Soon',
                    'Full step-by-step instructions will be generated next.'
                  )
                }
              >
                <Text className="text-lg font-black text-white">
                  Start Cooking
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

const EmptyPantryState = () => (
  <View className="items-center justify-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
    <Feather name="shopping-bag" size={60} color="#333" />
    <Text className="mt-4 text-lg font-bold text-center text-white/50">
      Pantry Empty
    </Text>
    <Text className="px-10 mt-2 text-center text-white/20">
      Add ingredients to your inventory to unlock personalized AI recipe
      suggestions.
    </Text>
  </View>
);

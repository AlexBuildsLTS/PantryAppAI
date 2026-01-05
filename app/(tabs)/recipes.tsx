/**
 * @file recipes.tsx
 * @description AAA+ Tier Chef AI Orchestration Engine.
 * Features: Automated Shopping replenishment, high-fidelity recipe cards,
 * instruction rendering, and glassmorphic detail views.
 * @author Pantry Pal Engineering
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Modal,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

// Internal Systems
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingService } from '../../services/ShoppingService';

const { width } = Dimensions.get('window');

/**
 * AAA+ RECIPE INTERFACE
 */
interface Recipe {
  title: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories?: string;
  description: string;
  missing?: string[];
  ingredients?: string[]; // Planned ahead: Full list for UI rendering
  instructions?: string[]; // Planned ahead: Step-by-step for UI rendering
  logic: string;
}

/**
 * @component RecipeSkeleton
 */
const RecipeSkeleton = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.skeletonContainer}>
      <View
        style={[styles.skeletonCard, { backgroundColor: colors.surface }]}
      />
      <View style={styles.skeletonRow}>
        <View
          style={[styles.skeletonHalf, { backgroundColor: colors.surface }]}
        />
        <View
          style={[styles.skeletonHalf, { backgroundColor: colors.surface }]}
        />
      </View>
      <View
        style={[styles.skeletonCard, { backgroundColor: colors.surface }]}
      />
    </View>
  );
};

export default function RecipesScreen() {
  const { colors } = useTheme();
  const { household } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isReplenishing, setIsReplenishing] = useState(false);

  /**
   * DATA FETCHING: AI Recipe Engine
   */
  const {
    data: recipes = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Recipe[]>({
    queryKey: ['ai-recipes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gemini-recipes');
      if (error) throw error;
      return data.recipes || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleOpenRecipe = useCallback((recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRecipe(recipe);
  }, []);

  const handleReplenish = async () => {
    if (!selectedRecipe?.missing || !household?.id) return;

    try {
      setIsReplenishing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ShoppingService.addMissingToGroceries(
        household.id,
        selectedRecipe.missing
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'List Updated',
          'Missing items have been added to your shopping tab.'
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update shopping list.');
    } finally {
      setIsReplenishing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons
              name="auto-fix"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>
              AI POWERED
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Chef AI</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Personalized culinary concepts based on your live inventory.
          </Text>
        </View>

        {isLoading ? (
          <RecipeSkeleton />
        ) : (
          <View style={styles.grid}>
            {recipes.map((recipe, index) => (
              <Animated.View
                key={`${recipe.title}-${index}`}
                entering={FadeInDown.delay(index * 100).springify()}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenRecipe(recipe)}
                  style={[
                    styles.recipeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardMain}>
                    <Text
                      style={[styles.recipeTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {recipe.title}
                    </Text>
                    <View style={styles.tagRow}>
                      <View
                        style={[
                          styles.tag,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Feather
                          name="clock"
                          size={10}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.tagText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {recipe.time}
                        </Text>
                      </View>
                      {recipe.missing && recipe.missing.length > 0 && (
                        <View
                          style={[
                            styles.tag,
                            { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
                          ]}
                        >
                          <Text style={[styles.tagText, { color: '#F59E0B' }]}>
                            {recipe.missing.length} Missing
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.goButton,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Feather name="chevron-right" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* RECIPE DETAIL MODAL */}
      <Modal visible={!!selectedRecipe} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <SafeAreaView style={styles.modalSafe}>
            <Animated.View
              entering={FadeInUp.springify()}
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedRecipe(null)}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.modalCategory}>CHEF{"'"}S SELECTION</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
              >
                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  {selectedRecipe?.title}
                </Text>

                <View style={styles.statGrid}>
                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={styles.statLabel}>PREP</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {selectedRecipe?.time}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={styles.statLabel}>INTENSITY</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {selectedRecipe?.difficulty}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={styles.statLabel}>CALORIES</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {selectedRecipe?.calories || '420'}
                    </Text>
                  </View>
                </View>

                {/* AI REASONING CARD */}
                <View
                  style={[
                    styles.logicCard,
                    {
                      backgroundColor: colors.primary + '08',
                      borderColor: colors.primary + '20',
                    },
                  ]}
                >
                  <View style={styles.row}>
                    <MaterialCommunityIcons
                      name="brain"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.logicTitle, { color: colors.primary }]}
                    >
                      AI RATIONALE
                    </Text>
                  </View>
                  <Text
                    style={[styles.logicText, { color: colors.textSecondary }]}
                  >
                    {selectedRecipe?.logic}
                  </Text>
                </View>

                {/* INGREDIENTS SECTION */}
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Ingredients Needed
                </Text>
                {selectedRecipe?.ingredients?.map((ing, i) => (
                  <View key={i} style={styles.listItem}>
                    <View
                      style={[
                        styles.bullet,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[styles.listText, { color: colors.textSecondary }]}
                    >
                      {ing}
                    </Text>
                  </View>
                ))}

                {/* AUTOMATED REPLENISHMENT TRIGGER */}
                {selectedRecipe?.missing &&
                  selectedRecipe.missing.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.replenishBtn,
                        { borderColor: colors.primary },
                      ]}
                      onPress={handleReplenish}
                      disabled={isReplenishing}
                    >
                      {isReplenishing ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <>
                          <Feather
                            name="shopping-cart"
                            size={18}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.replenishBtnText,
                              { color: colors.primary },
                            ]}
                          >
                            Add {selectedRecipe.missing.length} missing to list
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {/* INSTRUCTIONS SECTION */}
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: colors.text, marginTop: 32 },
                  ]}
                >
                  Instructions
                </Text>
                {selectedRecipe?.instructions?.map((step, i) => (
                  <View key={i} style={styles.stepItem}>
                    <Text
                      style={[styles.stepNumber, { color: colors.primary }]}
                    >
                      {i + 1}
                    </Text>
                    <Text
                      style={[styles.listText, { color: colors.textSecondary }]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.cookBtn, { backgroundColor: colors.primary }]}
                  onPress={() =>
                    Alert.alert(
                      'Coming Soon',
                      'Immersive Step-by-Step mode is currently in development.'
                    )
                  }
                >
                  <Text style={styles.cookBtnText}>Start Cooking Now</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </SafeAreaView>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  grid: { gap: 16 },
  recipeCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMain: { flex: 1, marginRight: 16 },
  recipeTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
  goButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSafe: { flex: 1 },
  modalContent: {
    flex: 1,
    marginTop: 40,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    padding: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCategory: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  detailTitle: { fontSize: 32, fontWeight: '900', marginBottom: 24 },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  statLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  statValue: { fontSize: 14, fontWeight: '800' },
  logicCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  logicTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  logicText: { fontSize: 14, lineHeight: 22 },
  sectionHeading: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  stepItem: { flexDirection: 'row', marginBottom: 20, gap: 16 },
  stepNumber: { fontSize: 18, fontWeight: '900', width: 24 },
  listText: { fontSize: 16, lineHeight: 24, flex: 1 },
  replenishBtn: {
    height: 58,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  replenishBtnText: { fontSize: 15, fontWeight: '800' },
  cookBtn: {
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  cookBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
  skeletonContainer: { gap: 16 },
  skeletonCard: { height: 120, borderRadius: 32, opacity: 0.5 },
  skeletonRow: { flexDirection: 'row', gap: 16 },
  skeletonHalf: { flex: 1, height: 100, borderRadius: 32, opacity: 0.5 },
});

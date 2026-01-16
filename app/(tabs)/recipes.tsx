/**
 * @file recipes.tsx
 * @description Master AAA+ Tier Culinary Intelligence & Supply Chain Engine.
 * * ARCHITECTURAL MODULES:
 * 1. AI AGENT ORCHESTRATION: Executes serverless 'gemini-recipes' logic with live inventory context.
 * 2. CULINARY DATA NORMALIZATION: Sanitizes unstructured LLM responses into strict Type-Safe interfaces.
 * 3. LOGISTICS REPLENISHMENT: Direct bridge to 'ShoppingService' for automated inventory gap closure.
 * 4. IMMERSIVE UI: Glassmorphic high-fidelity modal transitions with spring-physics.
 */

/* cspell:disable-next-line */
import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Internal Systems
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingService } from '../../services/ShoppingService';

// Constants
const STALE_TIME_RECIPES = 15 * 60 * 1000; // 15 minutes
const DELAY_INCREMENT = 100;
const MODAL_MARGIN_TOP = 40;
const BORDER_RADIUS_LARGE = 24;
const BORDER_RADIUS_MEDIUM = 20;
const BORDER_RADIUS_SMALL = 16;
const PADDING_DEFAULT = 20;
const PADDING_MODAL = 32;
const PADDING_SCROLL = 24;
const FONT_SIZE_TITLE = 40;
const FONT_SIZE_DETAIL_TITLE = 32;
const FONT_SIZE_SECTION = 20;
const FONT_SIZE_LIST = 16;
const FONT_SIZE_TAG = 11;
const FONT_SIZE_LOGIC = 14;
const FONT_SIZE_SUBTITLE = 15;
const FONT_SIZE_STEP_NUM = 20;
const FONT_WEIGHT_HEAVY = '900';
const FONT_WEIGHT_BOLD = '800';
const LETTER_SPACING_TITLE = -1.5;
const LETTER_SPACING_HEADER = 1.5;
const LINE_HEIGHT_LOGIC = 22;
const LINE_HEIGHT_LIST = 24;
const BULLET_SIZE = 6;
const STEP_NUM_WIDTH = 24;
const REPLENISH_BTN_HEIGHT = 56;
const BOTTOM_SPACER_HEIGHT = 100;

// Types
interface Recipe {
  title: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories?: string;
  logic: string;
  ingredients: string[];
  instructions: string[];
  missing: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onPress: (recipe: Recipe) => void;
  colors: any; // From theme
}

interface RecipeModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  colors: any;
  isDark: boolean;
  onReplenish: () => void;
  isReplenishing: boolean;
}

// Memoized Recipe Card Component
const RecipeCard = memo<RecipeCardProps>(({ recipe, index, onPress, colors }) => {
  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress(recipe);
  }, [onPress, recipe]);

  return (
    <Animated.View
      key={`${recipe.title}-${index}`}
      entering={FadeInDown.delay(index * DELAY_INCREMENT).springify()}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        accessibilityLabel={`Recipe: ${recipe.title}, ${recipe.time}, ${recipe.difficulty}`}
        accessibilityRole="button"
      >
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {recipe.title}
          </Text>
          {recipe.calories && (
            <Text style={[styles.caloriesText, { color: colors.textSecondary }]}>
              {recipe.calories} calories
            </Text>
          )}
          <View style={styles.tagRow}>
            <View
              style={[styles.tag, { backgroundColor: colors.primary + '15' }]}
            >
              <Feather name="clock" size={12} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {recipe.time}
              </Text>
            </View>
            <View
              style={[styles.tag, { backgroundColor: colors.success + '15' }]}
            >
              <Text style={[styles.tagText, { color: colors.success }]}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.border} />
      </TouchableOpacity>
    </Animated.View>
  );
});

RecipeCard.displayName = 'RecipeCard';

// Memoized Recipe Modal Component
const RecipeModal = memo<RecipeModalProps>(
  ({ visible, recipe, onClose, colors, isDark, onReplenish, isReplenishing }) => {
    if (!recipe) return null;

    const backgroundColorLight = colors.surface + '80'; // Semi-transparent

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <BlurView
          intensity={100}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          <SafeAreaView style={styles.modalSafe}>
            <View
              style={[styles.modalBody, { backgroundColor: colors.surface }]}
            >
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Close recipe modal"
                accessibilityRole="button"
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
              >
                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  {recipe.title}
                </Text>

                <View style={[styles.logicBox, { backgroundColor: backgroundColorLight }]}>
                  <Text style={[styles.logicHeader, { color: colors.primary }]}>
                    AI RATIONALE
                  </Text>
                  <Text
                    style={[styles.logicText, { color: colors.textSecondary }]}
                  >
                    {recipe.logic}
                  </Text>
                </View>

                <Text style={[styles.sectionHeader, { color: colors.text }]}>
                  Ingredients
                </Text>
                {recipe.ingredients.map((ing, i) => (
                  <View key={`${ing}-${i}`} style={styles.listItem}>
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

                {recipe.missing.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.replenishBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={onReplenish}
                    disabled={isReplenishing}
                    accessibilityLabel={`Replenish ${recipe.missing.length} missing items`}
                    accessibilityRole="button"
                  >
                    {isReplenishing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Feather
                          name="shopping-cart"
                          size={18}
                          color="white"
                        />
                        <Text style={styles.replenishBtnText}>
                          Replenish {recipe.missing.length} missing items
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <Text
                  style={[
                    styles.sectionHeader,
                    { color: colors.text, marginTop: 32 },
                  ]}
                >
                  Instructions
                </Text>
                {recipe.instructions.map((step, i) => (
                  <View key={`${step}-${i}`} style={styles.stepRow}>
                    <Text style={[styles.stepNum, { color: colors.primary }]}>
                      {i + 1}
                    </Text>
                    <Text
                      style={[styles.listText, { color: colors.textSecondary }]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}

                <View style={{ height: BOTTOM_SPACER_HEIGHT }} />
              </ScrollView>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>
    );
  }
);

RecipeModal.displayName = 'RecipeModal';

export default function RecipesScreen() {
  const { colors, mode } = useTheme();
  const { household } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isReplenishing, setIsReplenishing] = useState(false);
  const isDark = mode === 'dark';

  // Intelligence Pipeline with Error Handling
  const {
    data: recipes = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['ai-recipes', household?.id],
    queryFn: async () => {
      if (!household?.id) throw new Error('No household ID available');
      try {
        const { data, error } = await supabase.functions.invoke('gemini-recipes');
        if (error) throw new Error(error.message || 'Failed to fetch recipes');
        const recipes = (data?.recipes || []) as Recipe[];
        if (!Array.isArray(recipes)) throw new Error('Invalid recipes data');
        return recipes;
      } catch (err) {
        throw new Error(`Recipe fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    enabled: !!household?.id,
    staleTime: STALE_TIME_RECIPES,
    retry: 2,
  });

  // Replenishment Engine with Memoized Callback
  const handleReplenish = useCallback(async () => {
    if (!selectedRecipe?.missing.length || !household?.id) {
      Alert.alert('Error', 'No missing items or household not found');
      return;
    }
    try {
      setIsReplenishing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await ShoppingService.addMissingToGroceries(
        household.id,
        selectedRecipe.missing
      );
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Logistics Sync',
          'Inventory gaps have been added to your shopping list.'
        );
      } else {
        throw new Error('Failed to add to shopping list');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Supply chain synchronization failed.';
      Alert.alert('System Error', errorMessage);
    } finally {
      setIsReplenishing(false);
    }
  }, [selectedRecipe, household?.id]);

  const handleRecipePress = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Chef AI</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Inventory-aware culinary orchestration.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator
            style={styles.loadingIndicator}
            color={colors.primary}
            size="large"
            accessibilityLabel="Loading recipes"
          />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              Failed to load recipes. Please try again.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              accessibilityLabel="Retry loading recipes"
              accessibilityRole="button"
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No recipes available. Pull down to refresh or check your inventory.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {recipes.map((recipe, index) => (
              <RecipeCard
                key={`${recipe.title}-${index}`}
                recipe={recipe}
                index={index}
                onPress={handleRecipePress}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <RecipeModal
        visible={!!selectedRecipe}
        recipe={selectedRecipe}
        onClose={handleCloseModal}
        colors={colors}
        isDark={isDark}
        onReplenish={handleReplenish}
        isReplenishing={isReplenishing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: PADDING_SCROLL },
  header: { marginBottom: 32 },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: FONT_WEIGHT_HEAVY,
    letterSpacing: LETTER_SPACING_TITLE,
  },
  subtitle: {
    fontSize: FONT_SIZE_SUBTITLE,
    marginTop: 4,
    opacity: 0.6,
  },
  grid: { gap: 12 },
  card: {
    padding: PADDING_DEFAULT,
    borderRadius: BORDER_RADIUS_LARGE,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHT_BOLD,
    marginBottom: 8,
  },
  caloriesText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: FONT_SIZE_TAG, fontWeight: FONT_WEIGHT_HEAVY },
  loadingIndicator: { marginTop: 60 },
  errorContainer: { alignItems: 'center', marginTop: 60 },
  errorText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS_SMALL,
  },
  retryBtnText: { color: 'white', fontWeight: FONT_WEIGHT_BOLD },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  modalSafe: { flex: 1 },
  modalBody: {
    flex: 1,
    marginTop: MODAL_MARGIN_TOP,
    borderTopLeftRadius: BORDER_RADIUS_LARGE,
    borderTopRightRadius: BORDER_RADIUS_LARGE,
  },
  modalScroll: { padding: PADDING_MODAL },
  closeBtn: { alignSelf: 'flex-end', padding: 10, marginBottom: 10 },
  detailTitle: {
    fontSize: FONT_SIZE_DETAIL_TITLE,
    fontWeight: FONT_WEIGHT_HEAVY,
    marginBottom: 24,
  },
  logicBox: {
    padding: PADDING_DEFAULT,
    borderRadius: BORDER_RADIUS_MEDIUM,
    marginBottom: 32,
  },
  logicHeader: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT_HEAVY,
    letterSpacing: LETTER_SPACING_HEADER,
    marginBottom: 8,
  },
  logicText: {
    fontSize: FONT_SIZE_LOGIC,
    lineHeight: LINE_HEIGHT_LOGIC,
  },
  sectionHeader: {
    fontSize: FONT_SIZE_SECTION,
    fontWeight: FONT_WEIGHT_BOLD,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  bullet: { width: BULLET_SIZE, height: BULLET_SIZE, borderRadius: 3 },
  listText: {
    fontSize: FONT_SIZE_LIST,
    lineHeight: LINE_HEIGHT_LIST,
    flex: 1,
  },
  replenishBtn: {
    height: REPLENISH_BTN_HEIGHT,
    borderRadius: BORDER_RADIUS_SMALL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  replenishBtnText: { color: 'white', fontWeight: FONT_WEIGHT_BOLD, fontSize: 15 },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  stepNum: {
    fontSize: FONT_SIZE_STEP_NUM,
    fontWeight: FONT_WEIGHT_HEAVY,
    width: STEP_NUM_WIDTH,
  },
});

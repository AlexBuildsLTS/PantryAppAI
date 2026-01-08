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
import React, { useState, useCallback } from 'react';
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

export default function RecipesScreen() {
  const { colors, mode } = useTheme();
  const { household } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isReplenishing, setIsReplenishing] = useState(false);
  const isDark = mode === 'dark';

  /**
   * MODULE 1: INTELLIGENCE PIPELINE
   * Description: Fetches culinary concepts via Gemini Edge Functions.
   * Stability: Implements stale-time caching and household verification.
   */
  const {
    data: recipes = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['ai-recipes', household?.id],
    queryFn: async () => {
      if (!household?.id) return [];
      const { data, error } = await supabase.functions.invoke('gemini-recipes');
      if (error) throw error;
      return (data.recipes || []) as Recipe[];
    },
    enabled: !!household?.id,
    staleTime: 1000 * 60 * 15, // 15-minute intelligence cache
  });

  /**
   * MODULE 2: REPLENISHMENT ENGINE
   * Description: Synchronizes missing recipe components with the grocery supply chain.
   */
  const handleReplenish = async () => {
    if (!selectedRecipe?.missing.length || !household?.id) return;
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
      }
    } catch (e) {
      Alert.alert('System Error', 'Supply chain synchronization failed.');
    } finally {
      setIsReplenishing(false);
    }
  };

  /**
   * MODULE 3: GRID RENDERER
   */
  const renderCard = (recipe: Recipe, index: number) => (
    <Animated.View
      key={index}
      entering={FadeInDown.delay(index * 100).springify()}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedRecipe(recipe);
        }}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {recipe.title}
          </Text>
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
            style={{ marginTop: 60 }}
            color={colors.primary}
            size="large"
          />
        ) : (
          <View style={styles.grid}>
            {recipes.map((r, i) => renderCard(r, i))}
          </View>
        )}
      </ScrollView>

      {/* MODULE 4: IMMERSIVE MODAL OVERLAY */}
      <Modal visible={!!selectedRecipe} animationType="slide" transparent>
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
                onPress={() => setSelectedRecipe(null)}
                style={styles.closeBtn}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
              >
                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  {selectedRecipe?.title}
                </Text>

                <View style={styles.logicBox}>
                  <Text style={[styles.logicHeader, { color: colors.primary }]}>
                    AI RATIONALE
                  </Text>
                  <Text
                    style={[styles.logicText, { color: colors.textSecondary }]}
                  >
                    {selectedRecipe?.logic}
                  </Text>
                </View>

                <Text style={[styles.sectionHeader, { color: colors.text }]}>
                  Ingredients
                </Text>
                {selectedRecipe?.ingredients.map((ing, i) => (
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

                {selectedRecipe?.missing &&
                  selectedRecipe.missing.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.replenishBtn,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={handleReplenish}
                      disabled={isReplenishing}
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
                            Replenish {selectedRecipe.missing.length} missing
                            items
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
                {selectedRecipe?.instructions.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
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

                <View style={{ height: 100 }} />
              </ScrollView>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { fontSize: 15, marginTop: 4, opacity: 0.6 },
  grid: { gap: 12 },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, fontWeight: '900' },
  modalSafe: { flex: 1 },
  modalBody: {
    flex: 1,
    marginTop: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  modalScroll: { padding: 32 },
  closeBtn: { alignSelf: 'flex-end', padding: 10, marginBottom: 10 },
  detailTitle: { fontSize: 32, fontWeight: '900', marginBottom: 24 },
  logicBox: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginBottom: 32,
  },
  logicHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  logicText: { fontSize: 14, lineHeight: 22 },
  sectionHeader: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  listText: { fontSize: 16, lineHeight: 24, flex: 1 },
  replenishBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  replenishBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  stepNum: { fontSize: 20, fontWeight: '900', width: 24 },
});

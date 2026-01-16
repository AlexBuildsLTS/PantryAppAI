/**
 * @file app/(tabs)/recipes.tsx
 * @description Master AAA+ Tier Culinary Intelligence & Supply Chain Engine.
 * FIXES: 
 * 1. Import Resolution: Points to ../../lib/supabase singleton.
 * 2. Replenishment Sync: Integrated with corrected ShoppingService.
 * 3. Modern Styling: Uses boxShadow to comply with browser/native deprecation warnings.
 */

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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

// INTERNAL SYSTEM CORE
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingService } from '../../services/ShoppingService';

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

// Sub-component: Recipe Card
const RecipeCard = memo(({ recipe, index, onPress, colors }: any) => {
  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onPress(recipe);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{recipe.title}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="clock" size={12} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>{recipe.time}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#3B82F620' }]}>
              <Text style={[styles.tagText, { color: '#3B82F6' }]}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.border} />
      </TouchableOpacity>
    </Animated.View>
  );
});
RecipeCard.displayName = 'RecipeCard';

export default function RecipesScreen() {
  const { colors, isDark } = useTheme();
  const { household } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isReplenishing, setIsReplenishing] = useState(false);

  /**
   * MODULE 1: INTELLIGENCE PIPELINE
   * Fetches recipes from the Gemini AI Edge Function.
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
      const { data, error } = await supabase.functions.invoke('gemini-recipes', {
        body: { householdId: household.id }
      });
      if (error) throw error;
      return (data.recipes || []) as Recipe[];
    },
    enabled: !!household?.id,
    staleTime: 1000 * 60 * 15,
  });

  /**
   * MODULE 2: SUPPLY CHAIN SYNC
   * Adds missing ingredients to the Shopping List.
   */
  const handleReplenish = async () => {
    if (!selectedRecipe?.missing.length || !household?.id) return;
    try {
      setIsReplenishing(true);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await ShoppingService.addMissingToGroceries(
        household.id,
        selectedRecipe.missing
      );

      if (result.success) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Missing items added to supply chain.');
      }
    } catch (e: any) {
      Alert.alert('System Error', e.message);
    } finally {
      setIsReplenishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Chef AI</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            High-Performance Culinary Orchestration.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>SYNCING INVENTORY...</Text>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.loaderWrap}>
            <MaterialCommunityIcons name="food-off" size={48} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>No recipes found for your household.</Text>
            <Text style={[styles.loaderText, { color: colors.textSecondary, fontWeight: '400', fontSize: 13, marginTop: 8 }]}>Try syncing again or check your household settings.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {recipes.map((r, i) => (
              <RecipeCard key={i} recipe={r} index={i} onPress={setSelectedRecipe} colors={colors} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* IMMERSIVE MODAL OVERLAY */}
      <Modal visible={!!selectedRecipe} animationType="slide" transparent>
        <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={[styles.modalBody, { backgroundColor: colors.surface }]}>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.closeBtn}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedRecipe?.title}</Text>

                <View style={styles.logicBox}>
                  <Text style={[styles.logicHeader, { color: colors.primary }]}>AI LOGIC ENGINE</Text>
                  <Text style={[styles.logicText, { color: colors.textSecondary }]}>{selectedRecipe?.logic}</Text>
                </View>

                <Text style={[styles.sectionHeader, { color: colors.text }]}>Requirements</Text>
                {selectedRecipe?.ingredients.map((ing, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.listText, { color: colors.textSecondary }]}>{ing}</Text>
                  </View>
                ))}

                {selectedRecipe?.missing && selectedRecipe.missing.length > 0 && (
                  <TouchableOpacity
                    style={[styles.replenishBtn, { backgroundColor: colors.primary }]}
                    onPress={handleReplenish}
                    disabled={isReplenishing}
                  >
                    {isReplenishing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.replenishBtnText}>REPLENISH {selectedRecipe.missing.length} GAPS</Text>
                    )}
                  </TouchableOpacity>
                )}

                <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 32 }]}>Instructions</Text>
                {selectedRecipe?.instructions.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <Text style={[styles.stepNum, { color: colors.primary }]}>{i + 1}</Text>
                    <Text style={[styles.listText, { color: colors.textSecondary }]}>{step}</Text>
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
  scroll: { padding: 24, paddingBottom: 100 },
  header: { marginBottom: 32 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 4, opacity: 0.6 },
  grid: { gap: 12 },
  card: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)' // FIXED: Uses boxShadow for standard compatibility
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '900' },
  loaderWrap: { flex: 1, marginTop: 100, alignItems: 'center' },
  loaderText: { marginTop: 16, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  modalSafe: { flex: 1 },
  modalBody: { flex: 1, marginTop: 40, borderTopLeftRadius: 44, borderTopRightRadius: 44, overflow: 'hidden' },
  modalScroll: { padding: 32 },
  closeBtn: { alignSelf: 'flex-end', padding: 12, marginRight: 16, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  detailTitle: { fontSize: 30, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  logicBox: { padding: 20, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: 32 },
  logicHeader: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  logicText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  sectionHeader: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  listText: { fontSize: 16, lineHeight: 24, flex: 1, fontWeight: '600' },
  replenishBtn: { height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 },
  replenishBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  stepRow: { flexDirection: 'row', gap: 18, marginBottom: 24 },
  stepNum: { fontSize: 24, fontWeight: '900', width: 32, opacity: 0.8 },
});
/**
 * @file app/(tabs)/shopping.tsx
 * @description Master Grocery Supply Chain & Aisle-Sorting Engine.
 * FIXES: 
 * 1. Import Resolution: Points to ../../lib/supabase singleton.
 * 2. Schema Sync: Restock logic matches NOT NULL 'expiry_date' in pantry_items.
 * 3. Modern Styling: Uses boxShadow for High-Fidelity Web/Native parity.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
} from 'react-native-reanimated';

// INTERNAL SYSTEM CORE
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type ShoppingListItem = Tables<'shopping_list_items'>;
type ShoppingList = Tables<'shopping_lists'>;

export default function ShoppingScreen() {
  const { colors, isDark } = useTheme();
  const { household, user } = useAuth();
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState('');

  const householdId = household?.id;

  /**
   * MODULE 1: ACTIVE LIST RESOLVER
   * Description: Fetches or bootstraps the primary household shopping list.
   */
  const { data: activeList, isLoading: isListLoading } = useQuery({
    queryKey: ['active-list', householdId],
    queryFn: async () => {
      if (!householdId) return null;

      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('household_id', householdId)
        .eq('is_completed', false)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial 'Main Grocery' list for new households
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            household_id: householdId,
            name: 'Main Grocery',
            is_completed: false
          })
          .select()
          .single();

        if (createError) throw createError;
        return newList as ShoppingList;
      }
      return data as ShoppingList;
    },
    enabled: !!householdId,
  });

  /**
   * MODULE 2: ITEM HYDRATION
   */
  const {
    data: items = [],
    refetch,
    isRefetching,
    isLoading: isItemsLoading
  } = useQuery({
    queryKey: ['shopping-items', activeList?.id],
    queryFn: async () => {
      if (!activeList?.id) return [];
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', activeList.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShoppingListItem[];
    },
    enabled: !!activeList?.id,
  });

  /**
   * MODULE 3: AISLE INTELLIGENCE (Automatic Categorization)
   */
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingListItem[]> = {};
    items.forEach((item) => {
      const category = item.category || 'Pantry Essentials';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    return Object.keys(groups)
      .sort()
      .map((category) => ({
        title: category,
        data: groups[category].sort((a, b) => Number(a.is_bought) - Number(b.is_bought)),
      }));
  }, [items]);

  /**
   * MODULE 4: MUTATIONS (Atomic Supply Chain Operations)
   */
  const addItemMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!activeList?.id || !user?.id) return;
      return supabase.from('shopping_list_items').insert({
        list_id: activeList.id,
        name,
        added_by: user.id,
        category: 'Pantry Essentials',
        is_bought: false
      });
    },
    onSuccess: () => {
      setNewItemName('');
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      return supabase
        .from('shopping_list_items')
        .update({ is_bought: !status } as any)
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const restockMutation = useMutation({
    mutationFn: async () => {
      const boughtItems = items.filter((i) => i.is_bought);
      if (boughtItems.length === 0 || !householdId || !user?.id) return;

      // Map bought items to Pantry Schema
      // FIX: Added 'expiry_date' to satisfy NOT NULL database constraint
      const pantryInserts = boughtItems.map((item) => ({
        household_id: householdId,
        user_id: user.id,
        name: item.name,
        category: item.category || 'Other',
        quantity: item.quantity || 1,
        unit: 'pcs',
        status: 'fresh' as const,
        expiry_date: new Date(Date.now() + 7 * 86400000).toISOString()
      }));

      // 1. Commit to Inventory
      const { error: insertError } = await supabase.from('pantry_items').insert(pantryInserts);
      if (insertError) throw insertError;

      // 2. Clear from Shopping List
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .in('id', boughtItems.map((i) => i.id));

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
      queryClient.invalidateQueries({ queryKey: ['pantry-inventory'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Pantry Synced', 'Bought items moved to inventory.');
    },
  });

  const renderItem = useCallback(
    ({ item, index }: { item: ShoppingListItem; index: number }) => (
      <Animated.View
        entering={FadeInRight.delay(index * 30)}
        exiting={FadeOutLeft}
        layout={LinearTransition.springify()}
        style={styles.cardWrapper}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleMutation.mutate({ id: item.id, status: Boolean(item.is_bought) })}
          style={[
            styles.itemCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            item.is_bought && { opacity: 0.5 },
          ]}
        >
          <View style={styles.itemLeft}>
            <View style={[
              styles.checkbox,
              { borderColor: item.is_bought ? colors.primary : colors.border },
              item.is_bought && { backgroundColor: colors.primary }
            ]}>
              {item.is_bought && <Feather name="check" size={12} color="white" />}
            </View>
            <Text style={[
              styles.itemName,
              { color: colors.text },
              item.is_bought && styles.strikethrough
            ]}>
              {item.name}
            </Text>
          </View>
          <Text style={[styles.qtyText, { color: colors.primary }]}>x{item.quantity}</Text>
        </TouchableOpacity>
      </Animated.View>
    ),
    [colors, toggleMutation]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Supply Chain</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {household?.name || 'Active Vault'} • {items.length} Items
            </Text>
          </View>

          {items.some(i => i.is_bought) && (
            <TouchableOpacity
              onPress={() => restockMutation.mutate()}
              style={[styles.restockBtn, { backgroundColor: colors.primary + '20' }]}
            >
              <MaterialCommunityIcons name="package-variant-closed" size={18} color={colors.primary} />
              <Text style={[styles.restockText, { color: colors.primary }]}>RESTOCK</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <BlurView intensity={isDark ? 20 : 60} style={[styles.inputWrapper, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Provision name..."
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              onSubmitEditing={() => newItemName.trim() && addItemMutation.mutate(newItemName.trim())}
            />
            <TouchableOpacity
              onPress={() => newItemName.trim() && addItemMutation.mutate(newItemName.trim())}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Content */}
        {isListLoading || isItemsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <SectionList
            sections={groupedItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            renderSectionHeader={({ section: { title } }) => (
              <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title.toUpperCase()}</Text>
              </BlurView>
            )}
            renderItem={renderItem}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="cart-off" size={64} color={colors.border} />
                <Text style={{ color: colors.textSecondary, marginTop: 16, fontWeight: '600' }}>Supply chain is empty.</Text>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 13, fontWeight: '700', marginTop: 4, opacity: 0.6 },
  restockBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 8 },
  restockText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  inputContainer: { paddingHorizontal: 24, marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 20,
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)' // FIXED: Uses boxShadow for standard compatibility
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  addBtn: { width: 48, height: 48, borderRadius: 14, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  sectionHeader: { paddingVertical: 12, marginHorizontal: -24, paddingHorizontal: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  cardWrapper: { marginBottom: 12 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)' // FIXED: Standard compatibility
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 17, fontWeight: '700' },
  strikethrough: { textDecorationLine: 'line-through', opacity: 0.6 },
  qtyText: { fontWeight: '900', fontSize: 14, opacity: 0.8 },
  empty: { alignItems: 'center', marginTop: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
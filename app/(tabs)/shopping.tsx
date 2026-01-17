/**
 * @file app/(tabs)/shopping.tsx
 * @description Master Grocery Supply Chain & Aisle-Sorting Engine.
 * IMPROVEMENTS:
 * - Refactored data logic into ShoppingService for better separation of concerns
 * - Added custom React Query hooks for reusable logic
 * - Improved error handling with user-friendly alerts
 * - Enhanced performance with better memoization
 * - Cleaner component structure
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
} from 'react-native-reanimated';

// INTERNAL SYSTEM CORE
import { Tables } from '../../types/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  useActiveShoppingList,
  useShoppingListItems,
  useAddShoppingItem,
  useToggleShoppingItem,
  useRestockItems
} from '../../hooks/useShopping';

type ShoppingListItem = Tables<'shopping_list_items'>;

export default function ShoppingScreen() {
  const { colors, isDark } = useTheme();
  const { household } = useAuth();
  const [newItemName, setNewItemName] = useState('');

  // Custom hooks for data management
  const {
    data: activeList,
    isLoading: isListLoading,
    error: listError
  } = useActiveShoppingList();

  const {
    data: items = [],
    refetch,
    isRefetching,
    isLoading: isItemsLoading,
    error: itemsError
  } = useShoppingListItems(activeList?.id);

  const addItemMutation = useAddShoppingItem();
  const toggleMutation = useToggleShoppingItem();
  const restockMutation = useRestockItems();

  // Handle errors from queries
  React.useEffect(() => {
    if (listError) {
      Alert.alert('Error', 'Failed to load shopping list. Please try again.');
    }
    if (itemsError) {
      Alert.alert('Error', 'Failed to load shopping items. Please refresh.');
    }
  }, [listError, itemsError]);

  /**
   * AISLE INTELLIGENCE (Automatic Categorization)
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
   * Handle adding new item with error feedback
   */
  const handleAddItem = useCallback(async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;

    if (!activeList?.id) {
      Alert.alert('Error', 'No active shopping list available.');
      return;
    }

    try {
      await addItemMutation.mutateAsync({ listId: activeList.id, name: trimmedName });
      setNewItemName('');
    } catch {
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  }, [newItemName, activeList?.id, addItemMutation]);

  /**
   * Handle toggling item status with error feedback
   */
  const handleToggleItem = useCallback(async (item: ShoppingListItem) => {
    try {
      await toggleMutation.mutateAsync({
        itemId: item.id,
        currentStatus: Boolean(item.is_bought),
        listId: activeList!.id
      });
    } catch {
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  }, [activeList, toggleMutation]);

  /**
   * Handle restocking with error feedback
   */
  const handleRestock = useCallback(async () => {
    const boughtItems = items.filter((i) => i.is_bought);
    if (boughtItems.length === 0) return;

    try {
      await restockMutation.mutateAsync(boughtItems);
      Alert.alert('Pantry Synced', 'Bought items moved to inventory.');
    } catch {
      Alert.alert('Error', 'Failed to restock items. Please try again.');
    }
  }, [items, restockMutation]);

  /**
   * Optimized render item with better memoization
   */
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
          onPress={() => handleToggleItem(item)}
          style={[
            styles.itemCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            item.is_bought && { opacity: 0.5 },
          ]}
          disabled={toggleMutation.isPending}
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
    [colors, handleToggleItem, toggleMutation.isPending]
  );

  const isLoading = isListLoading || isItemsLoading;
  const isAnyMutationPending = addItemMutation.isPending || toggleMutation.isPending || restockMutation.isPending;

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

          {items.some(i => i.is_bought) && !restockMutation.isPending && (
            <TouchableOpacity
              onPress={handleRestock}
              style={[styles.restockBtn, { backgroundColor: colors.primary + '20' }]}
              disabled={restockMutation.isPending}
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
              onSubmitEditing={handleAddItem}
              editable={!addItemMutation.isPending}
            />
            <TouchableOpacity
              onPress={handleAddItem}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              disabled={addItemMutation.isPending || !newItemName.trim()}
            >
              {addItemMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Feather name="plus" size={24} color="white" />
              )}
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Content */}
        {isLoading ? (
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

        {/* Loading overlay for mutations */}
        {isAnyMutationPending && (
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }
});
/**
 * @file index.tsx
 * @description Enterprise-grade Inventory Dashboard for Pantry Pal.
 * Features: Reanimated 3 physics, search debouncing, AI Scanner integration,
 * and optimistic TanStack Query deletions.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Internal Systems
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { Tables } from '../../types/database.types';

// Components
import AddItemModal from '../../components/AddItemModal';
import AIFoodScanner from '../../components/AIFoodScanner';

// Layout Constants
const { width } = Dimensions.get('window');
const SPACING = 16;
const COLUMN_WIDTH = (width - SPACING * 3) / 2;
const CATEGORIES = ['All', 'Produce', 'Dairy', 'Protein', 'Pantry', 'Frozen'];

type PantryItem = Tables<'pantry_items'>;

/**
 * Animated Header Badge Component
 */
const InventoryBadge = React.memo(({ count }: { count: number }) => {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown}
      style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
    >
      <Text style={styles.badgeText}>{count} Items</Text>
    </Animated.View>
  );
});
InventoryBadge.displayName = 'InventoryBadge';
export default function PantryScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Local UI & Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal & Scanner State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<any>(null);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /**
   * DATA FETCHING
   */
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery<PantryItem[]>({
    queryKey: ['pantryItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  /**
   * MUTATION: Optimistic Deletion
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['pantryItems'] });
      const previousItems = queryClient.getQueryData(['pantryItems']);
      queryClient.setQueryData(
        ['pantryItems'],
        (old: PantryItem[] | undefined) =>
          old?.filter((item) => item.id !== deletedId) || []
      );
      return { previousItems };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['pantryItems'], context.previousItems);
      }
      Alert.alert('Error', 'Failed to delete item.');
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  /**
   * AI SCANNER LOGIC
   */
  const handleItemsDetected = (detectedItems: any[]) => {
    setIsScannerVisible(false);
    if (detectedItems.length > 0) {
      setScannedItemData(detectedItems[0]); // Pass first detected item to modal
      setIsAddModalVisible(true);
    }
  };

  /**
   * FILTERING & RENDER LOGIC
   */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ??
        false;
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearch, activeCategory]);

  const getUrgency = (dateStr: string | null) => {
    if (!dateStr) return { label: 'Fresh', color: colors.success };
    const days = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / 86400000
    );
    if (days < 0) return { label: 'Expired', color: colors.error };
    if (days <= 3) return { label: 'Critical', color: colors.warning };
    return { label: 'Soon', color: '#F59E0B' };
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" />

      {/* 1. Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, '#4338CA']}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <InventoryBadge count={filteredItems.length} />
        </View>

        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search items..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* 2. Category Filter Row */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(item);
              }}
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                activeCategory === item && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      activeCategory === item ? '#FFF' : colors.textSecondary,
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 3. Grid List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const urgency = getUrgency(item.expiry_date);
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 50)}
                exiting={FadeOut}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    Alert.alert('Delete', `Delete ${item.name}?`, [
                      { text: 'No' },
                      {
                        text: 'Delete',
                        onPress: () => deleteMutation.mutate(item.id),
                        style: 'destructive',
                      },
                    ]);
                  }}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.itemName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <View
                      style={[styles.dot, { backgroundColor: urgency.color }]}
                    />
                  </View>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {item.quantity} {item.unit || 'pcs'}
                  </Text>
                  <Text style={[styles.expiryLabel, { color: urgency.color }]}>
                    {urgency.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.border} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Pantry Empty
              </Text>
            </View>
          }
        />
      )}

      {/* 4. FAB Options */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: colors.surface, marginBottom: 12 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsScannerVisible(true);
          }}
        >
          <MaterialCommunityIcons
            name="camera-iris"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setScannedItemData(null);
            setIsAddModalVisible(true);
          }}
        >
          <Feather name="plus" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 5. Modals */}
      <AddItemModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        initialData={scannedItemData}
      />

      <AIFoodScanner
        isVisible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onItemsDetected={handleItemsDetected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 54,
    alignItems: 'center',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#0F172A', fontWeight: '500' },
  filterWrapper: { marginVertical: 8 },
  filterList: { paddingHorizontal: 20, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  listContainer: { padding: SPACING, paddingBottom: 150 },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    width: COLUMN_WIDTH,
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  expiryLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 12,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    alignItems: 'center',
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
});

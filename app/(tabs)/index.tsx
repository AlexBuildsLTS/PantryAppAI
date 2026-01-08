/**
 * @file index.tsx
 * @description Master Inventory Intelligence Dashboard.
 * * AAA+ ARCHITECTURE:
 * 1. Relational Hydration: Joins 'storage_locations' for contextual metadata.
 * 2. Search Orchestration: High-performance debounced filtering.
 * 3. Haptic UI Loop: Integrated tactile feedback for all major interactions.
 * 4. Micro-Interaction Engine: Reanimated 3 layout and entry transitions.
 * 5. State Persistence: Integrated with TanStack Query for cache reliability.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Internal System Contexts & Services
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../types/database.types';

// Shared Global Components
import AddItemModal from '../../components/AddItemModal';
import AIFoodScanner from '../../components/AIFoodScanner';

// Layout Infrastructure Constants
const { width } = Dimensions.get('window');
const SPACING = 16;
const COLUMN_WIDTH = (width - SPACING * 3) / 2;
const CATEGORIES = ['All', 'Produce', 'Dairy', 'Protein', 'Pantry', 'Frozen'];

// Composite Type for Database Joins
type PantryItemWithStorage = Tables<'pantry_items'> & {
  storage_locations: { name: string; location_type: string } | null;
};

export default function PantryScreen() {
  const { colors } = useTheme();
  const { household } = useAuth();
  const queryClient = useQueryClient();

  // Component State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<any>(null);

  /**
   * MODULE 1: SEARCH DEBOUNCER
   * Description: Prevents UI lag during heavy typing by delaying the
   * filter calculation by 300ms.
   */
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /**
   * MODULE 2: DATA HYDRATION ENGINE
   * Description: Executes complex relational join between pantry items
   * and storage locations using the Supabase PostgREST client.
   */
  const {
    data: items = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['pantry-inventory', household?.id],
    queryFn: async () => {
      if (!household?.id) return [];
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*, storage_locations(name, location_type)')
        .eq('household_id', household.id)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data as PantryItemWithStorage[];
    },
    enabled: !!household?.id,
  });

  /**
   * MODULE 3: OPTIMISTIC DELETION ENGINE
   * Description: Provides instant UI feedback by removing items from local
   * cache before the server confirms the delete operation.
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
      await queryClient.cancelQueries({ queryKey: ['pantry-inventory'] });
      const previous = queryClient.getQueryData(['pantry-inventory']);
      queryClient.setQueryData(['pantry-inventory'], (old: any) =>
        old?.filter((item: any) => item.id !== deletedId)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['pantry-inventory'], context?.previous);
      Alert.alert('System Error', 'Failed to remove inventory item.');
    },
    onSuccess: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  });

  /**
   * MODULE 4: URGENCY & STATUS LOGIC
   * Description: Core business logic that translates database timestamps into
   * human-readable urgency labels and associated color tokens.
   */
  const getUrgency = (item: PantryItemWithStorage) => {
    if (!item.expiry_date) return { label: 'Fresh', color: colors.success };
    const days = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000
    );
    if (days < 0 || item.status === 'expired')
      return { label: 'Expired', color: colors.error };
    if (days <= 3) return { label: 'Critical', color: colors.warning };
    return { label: 'Good', color: colors.primary };
  };

  /**
   * MODULE 5: FILTER ORCHESTRATION
   * Description: Computational logic for handling multi-dimensional filtering
   * (Category + Search Query) using memoization for 60fps performance.
   */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        ?.toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearch, activeCategory]);

  /**
   * MODULE 6: ITEM RENDER (BENTO GRID CARD)
   * Description: High-fidelity card component with Long-Press interaction
   * for item removal and Haptic feedback.
   */
  const renderItem = ({
    item,
    index,
  }: {
    item: PantryItemWithStorage;
    index: number;
  }) => {
    const urgency = getUrgency(item);
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
        exiting={FadeOut}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Alert.alert(
              'Remove Item',
              `Are you sure you want to delete ${item.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  onPress: () => deleteMutation.mutate(item.id),
                  style: 'destructive',
                },
              ]
            );
          }}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
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
              style={[styles.statusDot, { backgroundColor: urgency.color }]}
            />
          </View>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit} •{' '}
            {item.storage_locations?.name || 'Kitchen'}
          </Text>
          <Text style={[styles.urgencyText, { color: urgency.color }]}>
            {urgency.label.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" />

      {/* MODULE 7: DYNAMIC HEADER ENGINE */}
      <LinearGradient
        colors={[colors.primary, '#4338CA']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{filteredItems.length} Items</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search pantry..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: '#0F172A' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* MODULE 8: INTERACTIVE CATEGORY BAR */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
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
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color={colors.border} />
              <Text
                style={{
                  color: colors.textSecondary,
                  marginTop: 12,
                  fontWeight: '600',
                }}
              >
                No items found
              </Text>
            </View>
          }
        />
      )}

      {/* MODULE 9: FLOATING ACTION ORCHESTRATOR (FAB) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: colors.surface, marginBottom: 16 },
          ]}
          onPress={() => setIsScannerVisible(true)}
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
            setScannedItemData(null);
            setIsAddModalVisible(true);
          }}
        >
          <Feather name="plus" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      <AddItemModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        initialData={scannedItemData}
      />
      <AIFoodScanner
        isVisible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onItemsDetected={(d) => {
          setScannedItemData(d[0]);
          setIsScannerVisible(false);
          setIsAddModalVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    alignItems: 'center',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
  filterContainer: { marginVertical: 12 },
  filterContent: { paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: { fontWeight: '700', fontSize: 13 },
  listPadding: { padding: SPACING, paddingBottom: 160 },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    width: COLUMN_WIDTH,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: 16, fontWeight: '800', flex: 1, marginRight: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  itemMeta: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  urgencyText: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 1,
  },
  fabContainer: { position: 'absolute', bottom: 100, right: 24 },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  loaderContainer: { marginTop: 100, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
});

/**
 * @file app/(tabs)/index.tsx
 * @description Master Inventory Intelligence Dashboard (AAA+ Enterprise Tier).
 * IMPROVED: Modularized components, custom hooks, enhanced error handling, performance optimizations.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOut, FadeInUp } from 'react-native-reanimated';
import { useQuery, useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';


// System Infrastructure
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../types/database.types';

// Shared Components
import AddItemModal from '../../components/AddItemModal';
import AIFoodScanner from '../../components/AIFoodScanner';

// Constants
const SPACING = 16;
const CATEGORIES = ['All', 'Produce', 'Dairy', 'Protein', 'Pantry', 'Frozen', 'Other'] as const;
const SEARCH_DEBOUNCE_MS = 350;

type PantryItemWithStorage = Tables<'pantry_items'> & {
  storage_locations?: { name: string; location_type: string } | null;
};

// Custom Hooks
function usePantryItems(enabled: boolean, householdId?: string) {
  return useQuery({
    queryKey: ['pantry-inventory', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*, storage_locations(name, location_type)')
        .eq('household_id', householdId)
        .order('expiry_date', { ascending: true });
      if (error) throw new Error(`Failed to fetch pantry items: ${error.message}`);
      return data as PantryItemWithStorage[];
    },
    enabled,
    retry: 3,
  });
}

function useInventoryFilters(items: PantryItemWithStorage[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false;
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearch, activeCategory]);

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredItems,
  };
}

function useAIScanner(householdId?: string, userId?: string) {
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<Partial<Tables<'pantry_items'>> | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const processAIScanMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      setIsProcessingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke('pantry-ai-scanner', {
          body: { image: base64Image, householdId, userId },
        });
        if (error) throw new Error(`AI scan failed: ${error.message}`);
        return data;
      } finally {
        setIsProcessingAI(false);
      }
    },
    onSuccess: (data) => {
      if (data?.detectedItems?.[0]) {
        setScannedItemData(data.detectedItems[0]);
        setIsAddModalVisible(true);
      } else {
        Alert.alert('No Items Detected', 'The AI could not detect any food items in the image.');
      }
    },
    onError: () => {
      Alert.alert('AI Error', 'Scanner failed to process image. Please try again.');
    },
  });

  const handleManualAdd = useCallback(() => {
    setScannedItemData(null);
    setIsAddModalVisible(true);
  }, []);

  const handleScannerTrigger = useCallback(() => {
    setIsScannerVisible(true);
  }, []);

  const handleAIResultDetected = useCallback((base64: string) => {
    setIsScannerVisible(false);
    processAIScanMutation.mutate(base64);
  }, [processAIScanMutation]);

  return {
    isProcessingAI,
    scannedItemData,
    isAddModalVisible,
    setIsAddModalVisible,
    isScannerVisible,
    setIsScannerVisible,
    handleManualAdd,
    handleScannerTrigger,
    handleAIResultDetected,
  };
}

// Extracted Components
interface ThemeColors {
  primary: string;
  surface: string;
  border: string;
  textSecondary: string;
  text: string;
  success: string;
  error: string;
  background: string;
}

interface ThemeShadows {
  medium: object;
  large: object;
}

const PantryHeader = React.memo<{
  colors: ThemeColors;
  shadows: ThemeShadows;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  itemCount: number;
}>(({ colors, shadows, searchQuery, setSearchQuery, itemCount }) => (
  <View style={[styles.headerContainer, shadows.medium]}>
    <LinearGradient colors={[colors.primary, '#4338CA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerPad}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.headerLabel}>SECURE VAULT ACCESS</Text>
          <Text style={styles.headerTitleMain}>Inventory</Text>
        </View>
        <View style={styles.badgeShell}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      </View>
      <BlurView intensity={30} style={styles.searchBarBox}>
        <Feather name="search" size={18} color="white" style={{ marginLeft: 15 }} />
        <TextInput
          placeholder="Query stock records..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={styles.searchInputCore}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </BlurView>
    </LinearGradient>
  </View>
));
PantryHeader.displayName = 'PantryHeader';

const CategoryFilter = React.memo<{
  colors: ThemeColors;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}>(({ colors, activeCategory, setActiveCategory }) => (
  <View style={styles.filterOuter}>
    <FlatList
      horizontal
      data={CATEGORIES}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => setActiveCategory(item)}
          style={[
            styles.chip,
            { backgroundColor: colors.surface, borderColor: colors.border },
            activeCategory === item && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.chipLabel, { color: activeCategory === item ? '#FFF' : colors.textSecondary }]}>
            {item}
          </Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item}
    />
  </View>
));
CategoryFilter.displayName = 'CategoryFilter';

const InventoryCard = React.memo<{
  item: PantryItemWithStorage;
  index: number;
  cardWidth: number;
  colors: ThemeColors;
}>(({ item, index, cardWidth, colors }) => {
  const getUrgency = useCallback((item: PantryItemWithStorage) => {
    if (!item.expiry_date) return { label: 'Fresh', color: colors.success };
    const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000);
    if (days < 0 || item.status === 'expired') return { label: 'Expired', color: colors.error };
    return { label: 'Stable', color: colors.primary };
  }, [colors]);

  const status = getUrgency(item);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40)} exiting={FadeOut}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.inventoryCard, { backgroundColor: colors.surface, borderColor: colors.border, width: cardWidth }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label.toUpperCase()}</Text>
        </View>
        <Text style={[styles.itemNameText, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit}
          </Text>
          <Feather name="chevron-right" size={14} color={colors.border} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
InventoryCard.displayName = 'InventoryCard';

const FABGroup = React.memo<{
  colors: ThemeColors;
  shadows: ThemeShadows;
  onScannerPress: () => void;
  onManualAddPress: () => void;
}>(({ colors, shadows, onScannerPress, onManualAddPress }) => (
  <View style={styles.fabAnchor}>
    <TouchableOpacity
      style={[styles.fabAlt, { backgroundColor: colors.surface }, shadows.large]}
      onPress={onScannerPress}
    >
      <MaterialCommunityIcons name="camera-iris" size={32} color={colors.primary} />
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.fabMain, { backgroundColor: colors.primary }, shadows.large]}
      onPress={onManualAddPress}
    >
      <Feather name="plus" size={36} color="#FFF" />
    </TouchableOpacity>
  </View>
));
FABGroup.displayName = 'FABGroup';

const LoadingState = React.memo<{ colors: ThemeColors; isProcessingAI: boolean }>(({ colors, isProcessingAI }) => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} />
    {isProcessingAI && (
      <Text style={[styles.aiLoadText, { color: colors.text }]}>GEMINI IS ANALYZING VISUALS...</Text>
    )}
  </View>
));
LoadingState.displayName = 'LoadingState';

const EmptyState = React.memo<{ colors: ThemeColors }>(({ colors }) => (
  <Animated.View entering={FadeInUp} style={styles.emptyWrap}>
    <MaterialCommunityIcons name="package-variant" size={100} color={colors.border} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Records Found</Text>
  </Animated.View>
));
EmptyState.displayName = 'EmptyState';

// Main Component
export default function PantryScreen() {
  const { colors, shadows } = useTheme();
  const { household, user, profile, refreshMetadata, isLoading: authLoading } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  // Layout calculations
  const { columns, cardWidth } = useMemo(() => {
    let cols = 2;
    if (Platform.OS === 'web') {
      if (windowWidth > 1200) cols = 4;
      else if (windowWidth > 800) cols = 3;
    }
    const totalPadding = 48;
    const gap = SPACING * (cols - 1);
    const availableWidth = Math.min(windowWidth, 1400);
    return {
      columns: cols,
      cardWidth: (availableWidth - totalPadding - gap) / cols,
    };
  }, [windowWidth]);

  // Data fetching
  const { data: items = [], isLoading: isInventoryLoading, refetch, isRefetching, error: fetchError } = usePantryItems(
    !!household?.id && !!profile,
    household?.id
  ) as { data: PantryItemWithStorage[]; isLoading: boolean; refetch: () => void; isRefetching: boolean; error: Error | null };

  // Filtering
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, filteredItems } = useInventoryFilters(items);

  // AI Scanner
  const {
    isProcessingAI,
    scannedItemData,
    isAddModalVisible,
    setIsAddModalVisible,
    isScannerVisible,
    setIsScannerVisible,
    handleManualAdd,
    handleScannerTrigger,
    handleAIResultDetected,
  } = useAIScanner(household?.id, user?.id);

  // Auth error state
  if (!authLoading && !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <TouchableOpacity style={styles.recoveryBtn} onPress={() => refreshMetadata()}>
          <Text style={{ color: colors.primary, fontWeight: '900' }}>RE-SYNC IDENTITY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Data error state
  if (fetchError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.error }]}>Failed to Load Inventory</Text>
        <TouchableOpacity style={styles.recoveryBtn} onPress={() => refetch()}>
          <Text style={{ color: colors.primary, fontWeight: '900' }}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="light" />

      <PantryHeader
        colors={colors}
        shadows={shadows}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        itemCount={filteredItems.length}
      />

      <CategoryFilter colors={colors} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

      {isInventoryLoading || isProcessingAI ? (
        <LoadingState colors={colors} isProcessingAI={isProcessingAI} />
      ) : (
        <FlatList
          key={columns}
          data={filteredItems}
          numColumns={columns}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <InventoryCard item={item} index={index} cardWidth={cardWidth} colors={colors} />
          )}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState colors={colors} />}
        />
      )}

      <FABGroup
        colors={colors}
        shadows={shadows}
        onScannerPress={handleScannerTrigger}
        onManualAddPress={handleManualAdd}
      />

      <AddItemModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        initialData={scannedItemData as ThemeColors}
      />

      {isScannerVisible && (
        <AIFoodScanner onClose={() => setIsScannerVisible(false)} onItemsDetected={handleAIResultDetected} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { borderBottomLeftRadius: 44, borderBottomRightRadius: 44, overflow: 'hidden', backgroundColor: 'black' },
  headerPad: { padding: 24, paddingBottom: 40, paddingTop: Platform.OS === 'ios' ? 10 : 30 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  headerTitleMain: { fontSize: 42, fontWeight: '900', color: 'white', letterSpacing: -1.5, marginTop: 4 },
  badgeShell: { width: 54, height: 54, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontWeight: '900', fontSize: 18 },
  searchBarBox: { height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInputCore: { flex: 1, marginLeft: 15, fontSize: 17, fontWeight: '700', color: 'white' },
  filterOuter: { marginVertical: 20 },
  chip: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, marginRight: 12, borderWidth: 1 },
  chipLabel: { fontWeight: '800', fontSize: 14 },
  listContainer: { padding: 24, paddingBottom: 220 },
  gridRow: { justifyContent: 'space-between' },
  inventoryCard: { padding: 20, borderRadius: 36, borderWidth: 1, marginBottom: SPACING },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  itemNameText: { fontSize: 18, fontWeight: '900', lineHeight: 22, height: 44 },
  cardFooter: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemMeta: { fontSize: 13, fontWeight: '700' },
  fabAnchor: { position: 'absolute', bottom: 120, right: 30, alignItems: 'center' },
  fabMain: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  fabAlt: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', marginTop: 80, paddingHorizontal: 50 },
  emptyTitle: { fontSize: 28, fontWeight: '900', marginTop: 24 },
  aiLoadText: { marginTop: 24, fontWeight: '900', letterSpacing: 1, fontSize: 14 },
  retryBtn: { marginTop: 20 },
  recoveryBtn: { marginTop: 32, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20, backgroundColor: '#4F46E5' }
});
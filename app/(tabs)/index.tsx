import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

// Unified Service Import
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Tables } from '@/types/database.types';

type PantryItem = Tables<'pantry_items'>;

// Constants
const LOCATIONS = ['All', 'Pantry', 'Fridge', 'Freezer'];
const MS_PER_DAY = 86400000;

export default function PantryScreen() {
  const { colors } = useTheme();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pantryItems'],
    queryFn: async (): Promise<PantryItem[]> => {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const filteredItems = useMemo(() => {
    return items.filter((item: PantryItem) => {
      const nameMatch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
      const locMatch =
        filter === 'All' ||
        item.location?.toLowerCase() === filter.toLowerCase();
      return nameMatch && locMatch;
    });
  }, [items, search, filter]);

  const getExpiryStatus = useCallback(
    (date: string | null) => {
      if (!date) return { label: 'Fresh', color: colors.success };
      try {
        const expiryDate = new Date(date);
        if (isNaN(expiryDate.getTime()))
          return { label: 'Invalid Date', color: colors.error };

        const diff = expiryDate.getTime() - Date.now();
        const days = Math.ceil(diff / MS_PER_DAY);
        if (days < 0) return { label: 'Expired', color: colors.error };
        if (days <= 3) return { label: 'Soon', color: colors.warning };
        return { label: 'Fresh', color: colors.success };
      } catch {
        return { label: 'Error', color: colors.error };
      }
    },
    [colors]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.primary, '#4338CA']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Pantry Inventory</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{items.length} Items</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search database..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(loc);
            }}
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              filter === loc && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textSecondary },
                filter === loc && { color: '#FFF' },
              ]}
            >
              {loc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[{ color: colors.error }]}>
            Error loading data: {error.message}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => {
            const status = getExpiryStatus(item.expiry_date);
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 50)}
                layout={Layout.springify()}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <View
                    style={[styles.dot, { backgroundColor: status.color }]}
                  />
                </View>

                <View style={styles.cardDetails}>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {item.quantity} {item.unit || 'pcs'} • {item.location}
                  </Text>
                </View>
                <Text style={[styles.expiryText, { color: status.color }]}>
                  {status.label}
                </Text>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.border} />
              <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
                Database empty.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      >
        <Feather name="plus" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 35,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 10,
  },
  input: { marginLeft: 10, flex: 1, fontSize: 16, color: '#1E293B' },
  filterRow: { flexDirection: 'row', padding: 20, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
  },
  chipText: { fontWeight: '700', fontSize: 13 },
  list: { padding: 20, paddingBottom: 100 },
  card: { padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: 18, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  meta: { fontSize: 14, fontWeight: '500' },
  expiryText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

// Replace with a local type definition for Tables
// Remove the import and define a minimal Tables type for pantry_items

type PantryItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string | null;
};

// Mimic the Tables generic for pantry_items
// You can expand PantryItem fields as needed

type Tables<T extends string> = T extends 'pantry_items' ? PantryItem : never;

interface ThemeColors {
  primary: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  success: string;
  error: string;
}

type PantryItemWithStorage = Tables<'pantry_items'> & {
  storage_locations?: { name: string; location_type: string } | null;
};

interface InventoryCardProps {
  item: PantryItemWithStorage;
  index: number;
  width: number;
  colors: ThemeColors;
}

/**
 * InventoryCard: Data visualization node.
 */
const InventoryCard: React.FC<InventoryCardProps> = ({ item, index, width, colors }) => {
  const statusColor = useMemo(() => {
    if (!item.expiry_date) return colors.success;
    const diff = new Date(item.expiry_date).getTime() - Date.now();
    if (diff < 0) return colors.error;
    if (diff < 3 * 86400000) return '#F59E0B'; // Warning color
    return colors.primary;
  }, [item.expiry_date, colors]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} layout={Layout.springify()}>
      <TouchableOpacity activeOpacity={0.9} style={[styles.inventoryCard, { backgroundColor: colors.surface, borderColor: colors.border, width }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'No expiry'}
          </Text>
        </View>
        <Text style={[styles.itemNameText, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.quantity} {item.unit}</Text>
          <Feather name="chevron-right" size={14} color={colors.border} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inventoryCard: { padding: 22, borderRadius: 36, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 11, fontWeight: '900' },
  itemNameText: { fontSize: 19, fontWeight: '900', height: 48 },
  cardFooter: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemMeta: { fontSize: 14, fontWeight: '800', opacity: 0.7 },
});

export default InventoryCard;
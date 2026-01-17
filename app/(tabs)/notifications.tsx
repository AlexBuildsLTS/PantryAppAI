/**
 * @file notifications.tsx
 * @description Smart Expiration Monitoring & Alert System.
 * Identifies high-risk items using date-math logic and provides
 * immediate resolution workflows (delete/consume).
 * Features: Real-time cache invalidation, custom warning aesthetics, and haptic feedback.
 * @author Pantry Pal Engineering
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeOutLeft,
  Layout,
} from 'react-native-reanimated';

// Internal Systems
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { Tables } from '../../types/database.types';

type PantryItem = Tables<'pantry_items'>;

const EXPIRY_WINDOW_DAYS = 3;

// Custom hook for fetching expiry alerts
const useExpiryAlerts = () => {
  return useQuery({
    queryKey: ['expiry-alerts'],
    queryFn: async (): Promise<PantryItem[]> => {
      const now = new Date();
      const expiryThreshold = new Date(now);
      expiryThreshold.setDate(now.getDate() + EXPIRY_WINDOW_DAYS);

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .lte('expiry_date', expiryThreshold.toISOString())
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

// Custom hook for resolving (deleting) an item
const useResolveItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiry-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['pantryItems'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Could not remove item. Please try again.');
    },
  });
};

// Utility function to safely format expiry date
const formatExpiryDate = (expiryDate: string | null): string => {
  if (!expiryDate) return 'Unknown';
  try {
    return new Date(expiryDate).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// AlertCard component for better separation of concerns
const AlertCard = React.memo<{
  item: PantryItem;
  index: number;
  colors: any;
  onPress: (item: PantryItem) => void;
}>(({ item, index, colors, onPress }) => {
  const expiryDate = new Date(item.expiry_date || '');
  const isExpired = !isNaN(expiryDate.getTime()) && expiryDate < new Date();
  const formattedDate = formatExpiryDate(item.expiry_date);

  return (
    <Animated.View
      key={item.id}
      entering={FadeInDown.delay(index * 100)}
      exiting={FadeOutLeft}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(item)}
        style={[
          styles.alertCard,
          {
            backgroundColor: isExpired
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(245, 158, 11, 0.1)',
            borderColor: isExpired
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(245, 158, 11, 0.2)',
          },
        ]}
        accessibilityLabel={`Alert for ${item.name}, ${isExpired ? 'expired' : 'expires soon'} on ${formattedDate}`}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isExpired ? colors.error : colors.warning,
            },
          ]}
        >
          <Feather
            name={isExpired ? 'x-circle' : 'alert-triangle'}
            size={20}
            color="white"
          />
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.name || 'Unnamed Item'}
          </Text>
          <Text
            style={[
              styles.expiryStatus,
              {
                color: isExpired ? colors.error : colors.warning,
              },
            ]}
          >
            {isExpired ? 'EXPIRED' : 'EXPIRES SOON'} • {formattedDate}
          </Text>
        </View>

        <Feather
          name="chevron-right"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const {
    data: alerts = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useExpiryAlerts();
  const resolveMutation = useResolveItem();

  const handleResolve = useCallback((item: PantryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Resolve Alert',
      `Did you consume "${item.name}" or should it be removed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Item',
          style: 'destructive',
          onPress: () => resolveMutation.mutate(item.id),
        },
      ]
    );
  }, [resolveMutation]);

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Failed to Load Alerts
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            There was an error fetching your expiry alerts. Please try again.
          </Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={[styles.retryText, { color: colors.primary }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.warning}
          />
        }
      >
        {/* 1. HEADER SECTION */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Alerts</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Priority items requiring immediate attention.
          </Text>
        </View>

        {/* 2. ALERTS LIST */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.warning} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
              Scanning for expiration risks...
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {alerts.length > 0 ? (
              alerts.map((item, index) => (
                <AlertCard
                  key={item.id}
                  item={item}
                  index={index}
                  colors={colors}
                  onPress={handleResolve}
                />
              ))
            ) : (
              <Animated.View
                entering={FadeInDown}
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkCircle,
                    { backgroundColor: colors.success + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={40}
                    color={colors.success}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  All Systems Clear
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  None of your items are reaching expiration in the next 72
                  hours.
                </Text>
              </Animated.View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

AlertCard.displayName = 'AlertCard';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  loaderContainer: { marginTop: 100, alignItems: 'center' },
  loaderText: { marginTop: 16, fontWeight: '600', fontSize: 13 },
  listContainer: { gap: 12 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '800' },
  expiryStatus: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 1,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 40,
    borderStyle: 'dashed',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 22 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 22, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  retryText: { fontSize: 16, fontWeight: '600' },
});

/**
 * @file notifications.tsx
 * @description Smart Expiration Monitoring & Alert System.
 * Identifies high-risk items using date-math logic and provides
 * immediate resolution workflows (delete/consume).
 * Features: Real-time cache invalidation, custom warning aesthetics, and haptic feedback.
 * @author Pantry Pal Engineering
 */

import React from 'react';
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

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  /**
   * DATA FETCHING: Critical Expiration Logic
   * Filters for items expiring between "Now" and "3 Days from Now".
   */
  const {
    data: alerts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['expiry-alerts'],
    queryFn: async (): Promise<PantryItem[]> => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .lte('expiry_date', threeDaysFromNow.toISOString())
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  /**
   * MUTATION: Resolve Alert (Consume/Delete)
   * Updates the global pantry cache to immediately reflect resolution.
   */
  const resolveMutation = useMutation({
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

  const handleResolve = (item: PantryItem) => {
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
  };

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
              alerts.map((item, index) => {
                const isExpired = new Date(item.expiry_date!) < new Date();

                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 100)}
                    exiting={FadeOutLeft}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleResolve(item)}
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
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isExpired
                              ? colors.error
                              : colors.warning,
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
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.expiryStatus,
                            {
                              color: isExpired ? colors.error : colors.warning,
                            },
                          ]}
                        >
                          {isExpired ? 'EXPIRED' : 'EXPIRES SOON'} •{' '}
                          {new Date(item.expiry_date!).toLocaleDateString()}
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
              })
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
});

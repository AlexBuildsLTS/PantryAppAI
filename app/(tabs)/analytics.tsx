/**
 * @file analytics.tsx
 * @description Master Intelligence & Sustainability Dashboard.
 * AAA+ Tier: Predictive forecasting, CO2 impact tracking, and Bento-grid UI.
 * Features: 7-day risk analysis, optimistic data hydration, and spring-physics.
 * @author Pantry Pal Engineering
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

// Internal Systems
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { PredictionService } from '../../services/PredictionService';
import { Tables } from '../../types/database.types';

type PantryItem = Tables<'pantry_items'>;

export default function AnalyticsScreen() {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';

  /**
   * DATA FETCHING: Inventory Sync
   * Switched to '*' to ensure all metadata (weight, status, category) is available.
   */
  const {
    data: items = [],
    refetch,
    isRefetching,
    isLoading,
  } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async (): Promise<PantryItem[]> => {
      const { data, error } = await supabase.from('pantry_items').select('*');

      if (error) throw error;
      return data || [];
    },
  });

  /**
   * AAA+ INTELLIGENCE ENGINE
   * Processes raw inventory data into actionable predictive insights.
   */
  const analytics = useMemo(() => {
    // 1. Core Efficiency Calculation
    const total = items.length;
    // Maps exact DB enums: 'fresh', 'expiring_soon', 'expired', 'consumed', 'wasted'
    const wastedCount = items.filter(
      (i) => i.status === 'expired' || i.status === 'wasted'
    ).length;
    const consumedCount = items.filter((i) => i.status === 'consumed').length;

    const efficiency =
      total > 0 ? Math.round(((total - wastedCount) / total) * 100) : 100;

    // 2. Sustainability Engine: CO2 Offset
    // Formula: (Weight Saved in Kg) * (CO2 prevented per kg - approx 2.5kg)
    const totalWeightKg =
      items.reduce((acc, curr) => acc + (curr.weight_grams || 500), 0) / 1000;
    const co2Saved = (totalWeightKg * (efficiency / 100) * 2.5).toFixed(1);

    // 3. Predictive Forecast (7-Day Window)
    const forecast = PredictionService.getWasteForecast(items);

    return {
      total,
      wastedCount,
      consumedCount,
      efficiency,
      co2Saved,
      forecast,
    };
  }, [items]);

  if (isLoading) return null;

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
            tintColor={colors.primary}
          />
        }
      >
        {/* 1. HEADER SECTION */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Intelligence
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Advanced forecasting and sustainability tracking.
          </Text>
        </Animated.View>

        {/* 2. PREDICTIVE HERO: THE WASTE WINDOW */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[
            styles.forecastCard,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '30',
            },
          ]}
        >
          <View style={styles.forecastHeader}>
            <View
              style={[styles.crystalBox, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons
                name="crystal-ball"
                size={24}
                color="white"
              />
            </View>
            <View>
              <Text style={[styles.forecastLabel, { color: colors.primary }]}>
                PREDICTIVE ANALYSIS
              </Text>
              <Text style={[styles.forecastTitle, { color: colors.text }]}>
                7-Day Waste Window
              </Text>
            </View>
          </View>

          <View style={styles.forecastBody}>
            <View style={styles.statMain}>
              <Text style={[styles.statValueLarge, { color: colors.text }]}>
                {analytics.forecast.count}
              </Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>
                Items at critical risk
              </Text>
            </View>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.primary + '20' },
              ]}
            />
            <View style={styles.statMain}>
              <Text style={[styles.statValueLarge, { color: colors.text }]}>
                {analytics.forecast.projectedWasteKg}kg
              </Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>
                Potential loss
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.aiActionBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="auto-fix" size={16} color="white" />
            <Text style={styles.aiActionText}>Prioritize with Chef AI</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 3. PERFORMANCE BENTO GRID */}
        <View style={styles.bentoRow}>
          <Animated.View
            entering={FadeInUp.delay(400)}
            style={[
              styles.bentoCardLarge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.progressRing,
                { borderColor: colors.primary + '20' },
              ]}
            >
              <Text style={[styles.ringText, { color: colors.primary }]}>
                {analytics.efficiency}%
              </Text>
            </View>
            <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>
              SYSTEM EFFICIENCY
            </Text>
          </Animated.View>

          <View style={styles.bentoCol}>
            <Animated.View
              entering={FadeInUp.delay(500)}
              style={[
                styles.bentoCardSmall,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Feather name="package" size={20} color={colors.primary} />
              <Text style={[styles.bentoValSmall, { color: colors.text }]}>
                {analytics.total}
              </Text>
              <Text
                style={[
                  styles.bentoLabelSmall,
                  { color: colors.textSecondary },
                ]}
              >
                TRACKED
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(600)}
              style={[
                styles.bentoCardSmall,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Feather name="shield" size={20} color={colors.success} />
              <Text style={[styles.bentoValSmall, { color: colors.text }]}>
                {analytics.consumedCount}
              </Text>
              <Text
                style={[
                  styles.bentoLabelSmall,
                  { color: colors.textSecondary },
                ]}
              >
                SAVED
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* 4. SUSTAINABILITY IMPACT */}
        <Animated.View entering={FadeInUp.delay(700)}>
          <BlurView
            intensity={25}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.impactCard, { borderColor: colors.success + '40' }]}
          >
            <View style={styles.impactHeader}>
              <MaterialCommunityIcons
                name="leaf"
                size={24}
                color={colors.success}
              />
              <Text style={[styles.impactTitle, { color: colors.success }]}>
                IMPACT SCORE
              </Text>
            </View>
            <Text style={[styles.impactText, { color: colors.textSecondary }]}>
              You prevented approximately
              <Text style={{ color: colors.text, fontWeight: '900' }}>
                {' '}
                {analytics.co2Saved}kg of CO2{' '}
              </Text>
              emissions this month. That{"'"}s equivalent to planting 2 trees!
            </Text>
          </BlurView>
        </Animated.View>

        {/* 5. DYNAMIC RISK FEED */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Action Feed
        </Text>
        {analytics.forecast.atRiskItems.length > 0 ? (
          analytics.forecast.atRiskItems.map((item, index) => (
            <Animated.View
              key={item.id}
              layout={Layout.springify()}
              entering={FadeInDown.delay(800 + index * 100)}
              style={[
                styles.riskRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.riskIndicator,
                  { backgroundColor: colors.warning },
                ]}
              />
              <View style={styles.riskContent}>
                <Text style={[styles.riskName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.riskMeta, { color: colors.textSecondary }]}
                >
                  {item.quantity} {item.unit} • Expiring in{' '}
                  {Math.ceil(
                    (new Date(item.expiry_date!).getTime() - Date.now()) /
                      86400000
                  )}{' '}
                  days
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.border} />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyRisk}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={48}
              color={colors.success}
            />
            <Text
              style={[styles.emptyRiskText, { color: colors.textSecondary }]}
            >
              Inventory fully optimized.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { fontSize: 15, marginTop: 6, lineHeight: 22 },

  // Forecast Hero Card
  forecastCard: {
    padding: 24,
    borderRadius: 40,
    borderWidth: 1,
    marginBottom: 20,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  crystalBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forecastLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  forecastTitle: { fontSize: 20, fontWeight: '800' },
  forecastBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statMain: { alignItems: 'center' },
  statValueLarge: { fontSize: 32, fontWeight: '900' },
  statDesc: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  divider: { width: 1, height: 40 },
  aiActionBtn: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  aiActionText: { color: 'white', fontWeight: '800', fontSize: 15 },

  // Bento Grid
  bentoRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  bentoCardLarge: {
    flex: 1.2,
    padding: 24,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ringText: { fontSize: 24, fontWeight: '900' },
  bentoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bentoCol: { flex: 1, gap: 16 },
  bentoCardSmall: {
    flex: 1,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
  },
  bentoValSmall: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  bentoLabelSmall: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // Impact Card
  impactCard: {
    padding: 24,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
    marginBottom: 32,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  impactTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  impactText: { fontSize: 14, lineHeight: 22 },

  // Risk Feed
  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  riskIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 16 },
  riskContent: { flex: 1 },
  riskName: { fontSize: 16, fontWeight: '800' },
  riskMeta: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  emptyRisk: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyRiskText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
});

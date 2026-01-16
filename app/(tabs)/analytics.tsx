/**
 * @file app/(tabs)/analytics.tsx
 * @description Enterprise-Grade Predictive Analytics & Sustainability Engine.
 * * ARCHITECTURAL MODULES:
 *  HOUSEHOLD SYNC: Primary data hydration via household_id for collaboration.
 *  ECOLOGICAL IMPACT ENGINE: Calculates CO2 offset based on inventory status.
 *  TYPE-SAFE PIPELINE: Strict parity with Supabase pantry_items schema.
 *  GLASSMORPHISM DESIGN: High-fidelity UI with Reanimated 4 spring physics.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

// Internal System Contexts & Services
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { PredictionService } from '../../services/PredictionService';
import { Tables } from '../../types/database.types';

// Strict Type Definition from Supabase Schema
type PantryItem = Tables<'pantry_items'>;

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { user, household } = useAuth();

  /**
   * MODULE 1: DATA PIPELINE (HOUSEHOLD SYNC)
   * Description: Hydrates inventory data using household_id to support collaboration.
   * Fix: Switched 'food_items' to 'pantry_items' to match Supabase schema.
   */
  const {
    data: items = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['analytics-inventory', household?.id],
    queryFn: async () => {
      if (!household?.id) return [];

      const { data, error } = await supabase
        .from('pantry_items') // Matches schema: public.pantry_items
        .select('*')
        .eq('household_id', household.id);

      if (error) throw error;
      return data as PantryItem[];
    },
    enabled: !!household?.id,
  });

  /**
   * MODULE 2: COMPUTATIONAL INTELLIGENCE
   * Description: Processes raw entries into sustainability KPIs and predictive risks.
   * Fix: Added null checks for expiry_date to resolve TypeScript Date errors.
   */
  const analytics = useMemo(() => {
    const total = items.length;

    // Status-based efficiency (Fresh vs Expired/Wasted)
    const healthyItems = items.filter((i) => i.status === 'fresh').length;

    const efficiency =
      total > 0 ? Math.round((healthyItems / total) * 100) : 100;

    // CO2 Calculation: Based on weight_grams from schema (defaulting to 500g if null)
    const totalMassKg =
      items.reduce((acc, curr) => acc + (Number(curr.weight_grams) || 500), 0) /
      1000;

    const co2Saved = (totalMassKg * (efficiency / 100) * 2.5).toFixed(1);

    // Predictive Risk Analysis (7-day window)
    const forecast = PredictionService.getWasteForecast(items);

    return { total, healthyItems, efficiency, co2Saved, forecast };
  }, [items]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
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
        {/* MODULE 3: INTELLIGENCE HEADER */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Intelligence
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Monitoring {household?.name || 'Pantry'} with predictive CO2
            modeling.
          </Text>
        </Animated.View>

        {/* MODULE 4: PREDICTIVE HERO CARD */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '25',
            },
          ]}
        >
          <View style={styles.heroHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons
                name="crystal-ball"
                size={24}
                color="white"
              />
            </View>
            <View>
              <Text style={[styles.kpiLabel, { color: colors.primary }]}>
                7-DAY WASTE WINDOW
              </Text>
              <Text style={[styles.kpiTitle, { color: colors.text }]}>
                Predictive Risk
              </Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statNode}>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {analytics.forecast.count}
              </Text>
              <Text
                style={[styles.statLabelNode, { color: colors.textSecondary }]}
              >
                Risk Items
              </Text>
            </View>
            <View
              style={[styles.vDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statNode}>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {analytics.forecast.projectedWasteKg}kg
              </Text>
              <Text
                style={[styles.statLabelNode, { color: colors.textSecondary }]}
              >
                Est. Loss
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="auto-fix" size={18} color="white" />
            <Text style={styles.actionBtnText}>Chef AI Rescue</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* MODULE 5: BENTO GRID ARCHITECTURE */}
        <View style={styles.bentoRow}>
          <Animated.View
            entering={FadeInUp.delay(400)}
            style={[
              styles.bentoLarge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.ring, { borderColor: colors.primary + '20' }]}>
              <Text style={[styles.ringVal, { color: colors.primary }]}>
                {analytics.efficiency}%
              </Text>
            </View>
            <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>
              HOUSEHOLD EFFICIENCY
            </Text>
          </Animated.View>

          <View style={styles.bentoCol}>
            <Animated.View
              entering={FadeInUp.delay(500)}
              style={[
                styles.bentoSmall,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Feather name="package" size={20} color={colors.primary} />
              <Text style={[styles.bentoSmallVal, { color: colors.text }]}>
                {analytics.total}
              </Text>
              <Text
                style={[
                  styles.bentoSmallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                TOTAL ITEMS
              </Text>
            </Animated.View>
            <Animated.View
              entering={FadeInUp.delay(600)}
              style={[
                styles.bentoSmall,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Feather name="shield" size={20} color={colors.success} />
              <Text style={[styles.bentoSmallVal, { color: colors.text }]}>
                {analytics.healthyItems}
              </Text>
              <Text
                style={[
                  styles.bentoSmallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                FRESH STATUS
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* MODULE 6: ECOLOGICAL SENTINEL CARD */}
        <Animated.View entering={FadeInUp.delay(700)}>
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.impactCard, { borderColor: colors.success + '30' }]}
          >
            <View style={styles.impactHeader}>
              <MaterialCommunityIcons
                name="leaf"
                size={22}
                color={colors.success}
              />
              <Text style={[styles.impactTitle, { color: colors.success }]}>
                SUSTAINABILITY IMPACT
              </Text>
            </View>
            <Text style={[styles.impactText, { color: colors.textSecondary }]}>
              You prevented{' '}
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                {analytics.co2Saved}kg of CO2
              </Text>{' '}
              emissions. This matches the absorption of{' '}
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                2 trees
              </Text>
              .
            </Text>
          </BlurView>
        </Animated.View>

        {/* MODULE 7: DYNAMIC RISK FEED */}
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
                style={[styles.riskMarker, { backgroundColor: colors.warning }]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.riskName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.riskMeta, { color: colors.textSecondary }]}
                >
                  {item.expiry_date
                    ? `Expires in ${Math.ceil(
                        (new Date(item.expiry_date).getTime() - Date.now()) /
                          86400000
                      )} days`
                    : 'No expiry set'}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={48}
              color={colors.success}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Inventory fully optimized. No immediate waste risks.
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 4, lineHeight: 22 },
  heroCard: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 20 },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  kpiTitle: { fontSize: 22, fontWeight: '800' },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  statNode: { alignItems: 'center' },
  statVal: { fontSize: 32, fontWeight: '900' },
  statLabelNode: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  vDivider: { width: 1, height: 40 },
  actionBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  bentoRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  bentoLarge: {
    flex: 1.2,
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ringVal: { fontSize: 22, fontWeight: '900' },
  bentoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bentoCol: { flex: 1, gap: 16 },
  bentoSmall: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1 },
  bentoSmallVal: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  bentoSmallLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  impactCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
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
  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  riskMarker: { width: 4, height: 32, borderRadius: 2, marginRight: 16 },
  riskName: { fontSize: 16, fontWeight: '800' },
  riskMeta: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

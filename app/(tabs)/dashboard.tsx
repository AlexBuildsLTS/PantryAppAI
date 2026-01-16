/**
 * @file dashboard.tsx
 * @module PantryPal.Dashboard.Core
 * @description THE MASTER COMMAND CENTER (Enterprise Tier AAA+).
 * Synchronized with Database Schema v2026.1 and SQL Migration Steps 1-23.
 * -----------------------------------------------------------------------------------
 * ARCHITECTURAL MODULES:
 * 1. ANALYTICS ENGINE: Real-time calculation of CO2 impact and USD savings.
 * 2. HYDRATION LAYER: Multi-query orchestration using TanStack Query.
 * 3. VISION BRIDGE: Direct integration with AIFoodScanner hardware layer.
 * 4. RBAC UI: Conditional rendering based on Step 1 User Roles (admin, premium, member).
 * -----------------------------------------------------------------------------------
 * FIXES:
 * - Property 'status' does not exist on type 'never' (Resolved via Explicit Casting).
 * - Glued FAB Buttons (Resolved via Flexbox Spacing).
 * - Silent Camera Blocking (Resolved via Direct User Gesture Trigger).
 * -----------------------------------------------------------------------------------
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Infrastructure & Domain Types
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../types/database.types';
import AIFoodScanner from '../../components/AIFoodScanner';

// --- CONSTANTS ---
const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = (WINDOW_WIDTH - 56) / 2;

// --- TYPES ---
interface DashboardStats {
    totalItems: number;
    expiringCount: number;
    savingsUsd: number;
    co2SavedKg: number;
    efficiencyScore: number;
}

/**
 * DashboardScreen Component
 */
export default function DashboardScreen() {
    const { colors, isDark, shadows } = useTheme();
    const { household, profile } = useAuth();
    const queryClient = useQueryClient();

    // Local UI State
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isScannerVisible, setIsScannerVisible] = useState(false);

    /**
     * MODULE 1: ANALYTICS AGGREGATOR
     * FIX: Uses (data as Tables<'pantry_items'>[]) to prevent 'never' type errors.
     * Synchronized with SQL Step 5 and Step 20.
     */
    const { data: metrics, isLoading: isMetricsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['dashboard-metrics', household?.id],
        queryFn: async (): Promise<DashboardStats> => {
            if (!household?.id) return { totalItems: 0, expiringCount: 0, savingsUsd: 0, co2SavedKg: 0, efficiencyScore: 0 };

            // Query inventory strictly typed
            const { data, count, error } = await supabase
                .from('pantry_items')
                .select('*', { count: 'exact' })
                .eq('household_id', household.id);

            if (error) throw error;

            const items = (data as Tables<'pantry_items'>[]) || [];

            // Urgency Logic: Expiring within 72 hours
            const now = new Date();
            const horizon = new Date();
            horizon.setDate(now.getDate() + 3);

            const expiringCount = items.filter(item => {
                if (!item.expiry_date) return false;
                const expiry = new Date(item.expiry_date);
                return expiry <= horizon && item.status !== 'expired' && item.status !== 'consumed';
            }).length;

            return {
                totalItems: count || 0,
                expiringCount,
                savingsUsd: profile?.total_savings_usd || 0,
                co2SavedKg: profile?.total_co2_saved_kg || 0,
                efficiencyScore: 100 - (profile?.waste_percentage || 0)
            };
        },
        enabled: !!household?.id && !!profile,
    });

    /**
     * MODULE 2: ACTIVITY HYDRATION
     * Fetches real-time audit logs from SQL Step 10 (inventory_logs).
     */
    type LogWithItem = Tables<'inventory_logs'> & { pantry_items: { name: string } | null };
    const { data: logs = [] } = useQuery({
        queryKey: ['activity-logs', household?.id],
        queryFn: async (): Promise<LogWithItem[]> => {
            if (!household?.id) return [];
            const { data, error } = await supabase
                .from('inventory_logs')
                .select(`*, pantry_items ( name )`)
                .eq('household_id', household.id)
                .order('logged_at', { ascending: false })
                .limit(10);
            if (error) throw error;
            return (data as LogWithItem[]) || [];
        },
        enabled: !!household?.id,
    });

    /**
     * MODULE 3: REFRESH ORCHESTRATION
     */
    const handleRefresh = async () => {
        setIsRefreshing(true);
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        await Promise.all([
            refetchStats(),
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
        ]);
        setIsRefreshing(false);
    };

    /**
     * MODULE 4: HARDWARE BRIDGE HANDLER
     * Description: Triggers camera modal immediately on direct click.
     */
    const handleLaunchScanner = useCallback(() => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setIsScannerVisible(true);
    }, []);

    const onDetectionComplete = () => {
        setIsScannerVisible(false);
        Alert.alert("Scan Received", "Processing Packaging Intel via Gemini...");
        // Invalidate cache to show new items
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }), 2000);
    };

    // Sub-Component: Loading Skeleton
    if (isMetricsLoading && !isRefreshing) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>INITIATING COMMAND CENTER...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* AMBIENT BACKGROUND LAYER */}
            <LinearGradient
                colors={[colors.primary + '15', 'transparent']}
                style={styles.bgGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.flex}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {/* 1. IDENTITY HEADER */}
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.greeting, { color: colors.textSecondary }]}>VAULT STATUS</Text>
                            <Text style={[styles.userName, { color: colors.text }]}>
                                {profile?.username?.toUpperCase() || 'COMMANDER'}
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.tierBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}>
                            <MaterialCommunityIcons name="shield-crown" size={14} color={colors.primary} />
                            <Text style={[styles.tierText, { color: colors.primary }]}>{profile?.tier?.toUpperCase() || 'FREE'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2. ANALYTICS GRID */}
                    <View style={styles.statsGrid}>
                        <Animated.View entering={FadeInDown.delay(100)} style={styles.statCardWrapper}>
                            <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={styles.statBlur}>
                                <View style={styles.statHeader}>
                                    <Feather name="layers" size={20} color={colors.primary} />
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL SKU</Text>
                                </View>
                                <Text style={[styles.statValue, { color: colors.text }]}>{metrics?.totalItems || 0}</Text>
                            </BlurView>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200)} style={styles.statCardWrapper}>
                            <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={styles.statBlur}>
                                <View style={styles.statHeader}>
                                    <MaterialCommunityIcons name="timer-sand" size={20} color={colors.error} />
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>CRITICAL</Text>
                                </View>
                                <Text style={[styles.statValue, { color: colors.text }]}>{metrics?.expiringCount || 0}</Text>
                            </BlurView>
                        </Animated.View>
                    </View>

                    {/* 3. IMPACT WIDGET (SQL Step 20) */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>SUSTAINABILITY METRICS</Text>
                    <Animated.View entering={FadeInDown.delay(300)}>
                        <LinearGradient
                            colors={[colors.primary, '#4338CA']}
                            style={[styles.impactCard, shadows.medium]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.impactHeader}>
                                <MaterialCommunityIcons name="molecule" size={32} color="white" />
                                <Text style={styles.impactTitle}>Carbon Ledger Impact</Text>
                            </View>

                            <View style={styles.impactRow}>
                                <View style={styles.impactItem}>
                                    <Text style={styles.impactValue}>{metrics?.co2SavedKg.toFixed(1) || '0.0'}kg</Text>
                                    <Text style={styles.impactLabel}>CO2 SAVED</Text>
                                </View>
                                <View style={styles.impactDivider} />
                                <View style={styles.impactItem}>
                                    <Text style={styles.impactValue}>${metrics?.savingsUsd.toFixed(2) || '0.00'}</Text>
                                    <Text style={styles.impactLabel}>USD GAIN</Text>
                                </View>
                                <View style={styles.impactDivider} />
                                <View style={styles.impactItem}>
                                    <Text style={styles.impactValue}>{metrics?.efficiencyScore || 0}%</Text>
                                    <Text style={styles.impactLabel}>UTILIZATION</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* 4. INTERACTION HUB */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>QUICK ACTIONS</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={handleLaunchScanner}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
                                <MaterialCommunityIcons name="camera-iris" size={32} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>AI VISION</Text>
                            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>packaging scan</Text>
                        </TouchableOpacity>

                        <View style={{ width: 16 }} />

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.success + '15' }]}>
                                <Feather name="plus-circle" size={32} color={colors.success} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>MANUAL</Text>
                            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>standard intake</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 5. AUDIT LOG MODULE (SQL Step 10) */}
                    <View style={styles.auditFeed}>
                        <View style={styles.feedHeader}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.text }]}>LIVE AUDIT FEED</Text>
                            <TouchableOpacity>
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>History</Text>
                            </TouchableOpacity>
                        </View>

                        {logs.length === 0 ? (
                            <View style={[styles.emptyLogs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={{ color: colors.textSecondary }}>NO RECENT DATA DETECTED</Text>
                            </View>
                        ) : (
                            logs.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInRight.delay(400 + (index * 50))}
                                    style={[styles.logRow, { borderBottomColor: colors.border }]}
                                >
                                    <View style={[styles.logIcon, { backgroundColor: item.action === 'ADDED' ? colors.success + '20' : colors.error + '20' }]}>
                                        <MaterialCommunityIcons
                                            name={item.action === 'ADDED' ? "package-variant-plus" : "package-variant-minus"}
                                            size={20}
                                            color={item.action === 'ADDED' ? colors.success : colors.error}
                                        />
                                    </View>
                                    <View style={styles.logBody}>
                                        <Text style={[styles.logText, { color: colors.text }]}>
                                            {item.pantry_items?.name || 'Item'}
                                            <Text style={styles.logSubtext}> was {item.action}</Text>
                                        </Text>
                                        <Text style={styles.logTime}>{item.logged_at ? new Date(item.logged_at).toLocaleTimeString() : '-'}</Text>
                                    </View>
                                    <Text style={[styles.logDelta, { color: item.action === 'ADDED' ? colors.success : colors.error }]}>
                                        {item.action === 'ADDED' ? '+' : ''}{item.quantity_delta}
                                    </Text>
                                </Animated.View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>

            {/* 6. OVERLAY LAYER: AI VISION HARDWARE */}
            {isScannerVisible && (
                <AIFoodScanner
                    onClose={() => setIsScannerVisible(false)}
                    onItemsDetected={onDetectionComplete}
                />
            )}
        </View>
    );
}

// --- MASTER STYLESHEET (PRO GRADE) ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    flex: { flex: 1 },
    loadingText: { marginTop: 20, fontSize: 10, fontWeight: '900', letterSpacing: 4 },
    bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: WINDOW_HEIGHT * 0.4 },
    safeArea: { flex: 1 },
    scrollContent: { padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
    greeting: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    userName: { fontSize: 38, fontWeight: '900', letterSpacing: -2, marginTop: 4 },
    tierBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
    tierText: { fontSize: 9, fontWeight: '900', marginLeft: 6, letterSpacing: 1 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
    statCardWrapper: { width: COLUMN_WIDTH },
    statBlur: { padding: 24, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginLeft: 8 },
    statValue: { fontSize: 36, fontWeight: '900' },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 20, opacity: 0.6 },
    impactCard: { borderRadius: 36, padding: 28, marginBottom: 40 },
    impactHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    impactTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginLeft: 15, letterSpacing: -0.5 },
    impactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    impactItem: { alignItems: 'center' },
    impactValue: { color: 'white', fontSize: 22, fontWeight: '900' },
    impactLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
    impactDivider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.15)' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 45 },
    actionBtn: {
        flex: 1,
        height: 130,
        borderRadius: 32,
        padding: 20,
        borderWidth: 1,
        // Deprecated shadow props replaced for web compatibility
        boxShadow: Platform.OS === 'web'
            ? '0px 4px 12px rgba(0,0,0,0.1)'
            : undefined,
        shadowColor: Platform.OS !== 'web' ? '#000' : undefined,
        shadowOffset: Platform.OS !== 'web' ? { width: 0, height: 4 } : undefined,
        shadowOpacity: Platform.OS !== 'web' ? 0.1 : undefined,
        shadowRadius: Platform.OS !== 'web' ? 12 : undefined,
    },
    actionIcon: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionLabel: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    actionSub: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.5 },
    auditFeed: { marginTop: 10 },
    feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    logIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    logBody: { flex: 1, marginLeft: 15 },
    logText: { fontSize: 15, fontWeight: '800' },
    logSubtext: { fontWeight: '400', opacity: 0.6 },
    logTime: { fontSize: 11, fontWeight: '600', opacity: 0.3, marginTop: 2 },
    logDelta: { fontSize: 16, fontWeight: '900' },
    emptyLogs: { padding: 40, borderRadius: 32, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1 }
});
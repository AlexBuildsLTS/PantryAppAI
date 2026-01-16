/**
 * @file dashboard.tsx
 *
 * ARCHITECTURAL MODULES:
 * PREDICTIVE ANALYTICS: Integrates with 'AnalyticsService' for waste reduction insights.
 * REAL-TIME ALERTS: Displays critical notifications from 'NotificationService'.
 * DYNAMIC WIDGETS: Renders contextual information based on user activity and inventory.
 * HAPTIC FEEDBACK: Provides tactile responses for key interactions.
 * MICRO-INTERACTION ENGINE: Reanimated 3 for fluid transitions and animations.
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Internal System Contexts & Services
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PredictionService } from '../../services/PredictionService';
import { supabase } from '../../services/supabase';
import { Tables } from '../../types/database.types';

// Layout constants
const SPACING = 16;
const CARD_HEIGHT = 160;

// Type definitions
/**
 * Type for analytics data returned by AnalyticsService.
 * Represents waste reduction insights and predictive analytics.
 */
interface AnalyticsData {
    wasteReduction: number;
    predictions: {
        item: string;
        expiryDate: string;
        action: string;
    }[];
    insights: Record<string, unknown>;
}

/**
 * Type for notification items.
 * Represents alerts and notifications displayed on the dashboard.
 */
interface NotificationItem {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: string;
    read: boolean;
}



/**
 * DashboardScreen component.
 *
 * This component serves as the main dashboard displaying analytics,
 * notifications, and dynamic widgets for pantry management.
 *
 * @returns The rendered dashboard screen.
 */
export default function DashboardScreen() {
    const { colors, isDark } = useTheme();
    const { household } = useAuth();

    // State management
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // Query for pantry items to compute analytics
    const { data: pantryItems, error: analyticsError, refetch: refetchAnalytics } = useQuery({
        queryKey: ['pantry-analytics', household?.id],
        queryFn: async (): Promise<Tables<'pantry_items'>[]> => {
            if (!household?.id) throw new Error('No household ID');
            const { data, error } = await supabase
                .from('pantry_items')
                .select('*')
                .eq('household_id', household.id);
            if (error) throw error;
            return data || [];
        },
        enabled: Boolean(household?.id),
    });

    // Compute analytics from pantry items
    const analyticsData: AnalyticsData | null = pantryItems ? (() => {
        const forecast = PredictionService.getWasteForecast(pantryItems);
        const totalItems = pantryItems.length;
        const wasteReduction = totalItems > 0 ? Math.max(0, Math.round((1 - forecast.count / totalItems) * 100)) : 100;
        return {
            wasteReduction,
            predictions: forecast.atRiskItems.map(item => ({
                item: item.name || 'Unknown',
                expiryDate: item.expiry_date || 'Unknown',
                action: 'Check expiry',
            })),
            insights: {
                totalItems,
                atRiskCount: forecast.count,
                projectedWaste: forecast.projectedWasteKg,
            },
        };
    })() : null;

    // Query for notifications
    const { data: notifications = [], error: notificationsError, refetch: refetchNotifications } = useQuery({
        queryKey: ['notifications', household?.id],
        queryFn: async (): Promise<NotificationItem[]> => {
            if (!household?.id) return [];
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('household_id', household.id)
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(ticket => ({
                id: ticket.id,
                message: ticket.subject || 'Support ticket',
                type: 'info' as const,
                timestamp: ticket.created_at || '',
                read: false,
            }));
        },
        enabled: Boolean(household?.id),
    });

    // Combined error state
    const error = analyticsError || notificationsError;

    // Memoized computed values for performance
    const unreadNotificationsCount = useMemo(
        () => notifications.filter((n: NotificationItem) => !n.read).length,
        [notifications]
    );

    /**
     * Handles refresh action.
     * Reloads data and provides haptic feedback.
     */
    const handleRefresh = async (): Promise<void> => {
        setIsRefreshing(true);
        try {
            await Promise.all([refetchAnalytics(), refetchNotifications()]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
            // Handle refresh error silently or show user feedback if needed
        } finally {
            setIsRefreshing(false);
        }
    };

    // Placeholder render - replace with actual dashboard UI
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                <Text></Text>
                {error && <Text>Error: {error.message}</Text>}

                {/* Add actual dashboard content here */
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            DASHBOARD
                        </Text>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                // Navigate to notifications screen or open a modal
                            }}
                        >
                            <Feather name="bell" size={24} color={colors.text} />
                            {unreadNotificationsCount > 0 && (
                                <View
                                    style={[
                                        styles.notificationBadge,
                                        { backgroundColor: colors.error },
                                    ]}
                                >
                                    <Text style={styles.notificationBadgeText}>
                                        {unreadNotificationsCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                }
                {/* Analytics Summary Widget */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.widgetContainer}>
                    <LinearGradient
                        colors={[colors.primary, '#4338CA']}
                        style={[styles.widget, styles.analyticsWidget]}
                    >
                        <View style={styles.widgetHeader}>
                            <Feather name="bar-chart-2" size={24} color="white" />
                            <Text style={styles.widgetTitle}>Waste Reduction</Text>
                        </View>
                        <Text style={styles.analyticsValue}>
                            {analyticsData?.wasteReduction || 0}%
                        </Text>
                        <Text style={styles.analyticsSubtitle}>
                            Less food waste this month!
                        </Text>
                    </LinearGradient>
                </Animated.View>
                {/* Quick Actions Widget */}
                {/* Quick Actions Widget */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.widgetContainer}>
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.widget}>
                        <View style={styles.widgetHeader}>
                            <Feather name="zap" size={20} color={colors.primary} />
                            <Text style={[styles.widgetTitle, { color: colors.text }]}>
                                Quick Actions
                            </Text>
                        </View>
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => { }}>
                                <Feather name="plus-circle" size={24} color={colors.primary} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Add Item</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={() => { }}>
                                <Feather name="camera" size={24} color={colors.primary} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Scan Item</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING,
        paddingVertical: SPACING,
        marginBottom: SPACING,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    widgetContainer: {
        marginHorizontal: SPACING,
        marginBottom: SPACING,
    },
    widget: {
        borderRadius: 12,
        padding: SPACING,
        borderWidth: 1,
    },
    analyticsWidget: {
        height: CARD_HEIGHT,
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING,
    },
    widgetTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    analyticsValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    analyticsSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: SPACING,
    },
    actionButton: {
        alignItems: 'center',
        padding: SPACING,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        flex: 1,
        marginHorizontal: 4,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
});
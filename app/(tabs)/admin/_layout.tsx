/**
 * THEME: MAKE IT SAME AS THE REST OF THIS APP
 * ENHANCEMENTS:
 * - Readability: Extracted styles to StyleSheet for better maintainability.
 * - Performance: Memoized styles and tab configurations to prevent unnecessary re-computations.
 * - Best Practices: Consistent use of Theme constants, added error handling for edge cases.
 * - Error Handling: Added fallback for authentication state to handle profile loading errors.
 */

import React, { useMemo } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, ShieldAlert } from 'lucide-react-native';
import { Platform, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

const TAB_BAR_HEIGHT_IOS = 90;
const TAB_BAR_HEIGHT_ANDROID = 70;
const TAB_BAR_PADDING_BOTTOM_IOS = 30;
const TAB_BAR_PADDING_BOTTOM_ANDROID = 12;

const tabConfigurations = [
    {
        name: 'index',
        title: 'Console',
        icon: ({ color }: { color: string }) => (
            <ShieldAlert size={24} color={color} strokeWidth={2.5} />
        ),
    },
    {
        name: 'users',
        title: 'Directory',
        icon: ({ color }: { color: string }) => (
            <Users size={24} color={color} strokeWidth={2.5} />
        ),
    },
];

export default function AdminLayout() {
    const { profile, isLoading: authLoading } = useAuth();
    const theme = useTheme();

    // Memoize styles to avoid re-computation on re-renders
    const tabBarStyles = useMemo(() => StyleSheet.create({
        tabBar: {
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            height: Platform.OS === 'ios' ? TAB_BAR_HEIGHT_IOS : TAB_BAR_HEIGHT_ANDROID,
            paddingBottom: Platform.OS === 'ios' ? TAB_BAR_PADDING_BOTTOM_IOS : TAB_BAR_PADDING_BOTTOM_ANDROID,
            paddingTop: 12,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
        },
        tabBarLabel: {
            fontSize: 10,
            fontWeight: '900',
            letterSpacing: 1,
            textTransform: 'uppercase',
        },
    }), [theme.colors.background, theme.colors.border]);

    const loadingStyles = useMemo(() => StyleSheet.create({
        loadingContainer: {
            flex: 1,
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
        },
    }), [theme.colors.background]);

    // --- 1. SYSTEM GATE: LOADING STATE ---
    if (authLoading) {
        return (
            <View style={loadingStyles.loadingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
        );
    }

    // --- 2. SECURITY GATE: STRICT ADMIN ONLY ---
    if (!profile || profile.role?.toLowerCase() !== 'admin') {
        return <Redirect href="/(app)" />;
    }

    // Glassmorphism admin badge
    const AdminBadge = () => (
        <LinearGradient
            colors={["#F87171", "#EF4444"]}
            style={{
                position: "absolute",
                top: 24,
                right: 24,
                borderRadius: 16,
                paddingHorizontal: 18,
                paddingVertical: 8,
                zIndex: 100,
                shadowColor: "#EF4444",
                shadowOpacity: 0.2,
                shadowRadius: 10,
            }}
        >
            <ShieldAlert size={16} color="#fff" />
            <View style={{ height: 4 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff", marginRight: 6 }} />
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 }}>ADMIN</Text>
            </View>
        </LinearGradient>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <AdminBadge />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: tabBarStyles.tabBar,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textSecondary,
                    tabBarLabelStyle: tabBarStyles.tabBarLabel,
                }}
            >
                {tabConfigurations.map((tab) => (
                    <Tabs.Screen
                        key={tab.name}
                        name={tab.name}
                        options={{
                            title: tab.title,
                            tabBarIcon: tab.icon,
                        }}
                    />
                ))}
            </Tabs>
        </View>
    );
}
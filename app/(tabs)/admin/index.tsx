import { useFocusEffect, useRouter } from 'expo-router';
import {
    AlertTriangle,
    ArrowRight,
    Baby,
    Cpu,
    Database,
    Server,
    ShieldCheck,
    Users,
    Zap,
} from 'lucide-react-native';

import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '@/lib/supabase';


// Fallback Theme object
const Theme = {
    colors: {
        primary: '#4FD1C7',
        secondary: '#9AE6B4',
    },
};

export default function AdminPortal() {
    const router = useRouter();
    // Removed unused width from useWindowDimensions

    const [stats, setStats] = useState({
        users: 0,
        logs: 0,
        growth: 0,
        tickets: 0,
        latency: '0ms',
    });
    const [loading, setLoading] = useState(true);

    const syncCoreMetrics = async () => {
        const start = Date.now();
        setLoading(true);
        try {
            const [u, e, t] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase
                    .from('inventory_logs') // changed from 'care_events' to 'inventory_logs'
                    .select('*', { count: 'exact', head: true }),
                supabase
                    .from('support_tickets')
                    .select('*', { count: 'exact', head: true }),
            ]);

            setStats({
                users: u.count || 0,
                logs: e.count || 0,
                growth: 0,
                tickets: t.count || 0,
                latency: `${Date.now() - start}ms`,
            });
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            syncCoreMetrics();
        }, []),
    );

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* 1. PORTAL IDENTITY */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>ADMIN PORTAL</Text>
                    <Text style={styles.headerSub}>BIOMETRIC SYSTEM ORCHESTRATOR</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.statusText}>SYSTEM OPERATIONAL</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={syncCoreMetrics}
                        tintColor={Theme.colors.primary}
                    />
                }
            >
                {/* 2. DIAGNOSTIC STRIP */}
                <View style={styles.diagStrip}>
                    <DiagItem icon={Database} label="LATENCY" value={stats.latency} />
                    <DiagItem
                        icon={Server}
                        label="GATEWAY"
                        value="ENCRYPTED"
                        color="#9AE6B4"
                    />
                </View>

                {/* 3. CORE METRICS GRID: Icon Top-Left, Symmetric */}
                <View style={styles.metricsGrid}>
                    <MetricCard
                        title="USERS"
                        value={stats.users}
                        icon={Users}
                        color={Theme.colors.primary}
                        onPress={() => router.push('/(tabs)/admin/users')}
                    />
                    <MetricCard
                        title="CARE LOGS"
                        value={stats.logs}
                        icon={Zap}
                        color="#FB923C"
                    />
                    <MetricCard
                        title="GROWTH"
                        value={stats.growth}
                        icon={Baby}
                        color={Theme.colors.secondary}
                    />
                    <MetricCard
                        title="TICKETS"
                        value={stats.tickets}
                        icon={AlertTriangle}
                        color="#F87171"
                    />
                </View>

                {/* 4. MANAGEMENT MODULES */}
                <Text style={styles.sectionLabel}>MANAGEMENT MODULES</Text>
                <View style={styles.actionColumn}>
                    <ModuleButton
                        title="User Directory"
                        desc="Manage users, roles, and system access."
                        icon={Users}
                        onPress={() => router.push('/(tabs)/admin/users')}
                    />
                    <ModuleButton
                        title="Intelligence Core"
                        desc="Monitor AI accuracy and neural processing latency."
                        icon={Cpu}
                    />
                </View>

                {/* 5. AUDIT FOOTER */}
                <View style={styles.auditLog}>
                    <ShieldCheck size={16} color="#9AE6B4" />
                    <Text style={styles.auditText}>
                        REAL-TIME RLS ENCRYPTION ACTIVE • ALL SESSIONS MONITORED
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- SUB-COMPONENTS ---

const MetricCard = ({ title, value, icon: Icon, color, onPress }: any) => (
    <View style={styles.cardWrapper}>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.metricCard}
        >
            <View style={styles.iconTopLeft}>
                <Icon size={18} color={color} />
            </View>
            <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricTitle}>{title}</Text>
            </View>
        </TouchableOpacity>
    </View>
);

const DiagItem = ({
    icon: Icon,
    label,
    value,
    color = Theme.colors.primary,
}: any) => (
    <View style={styles.diagItem}>
        <Icon size={14} color={color} />
        <Text style={styles.diagLabel}>
            {label}: <Text style={{ color: '#FFF' }}>{value}</Text>
        </Text>
    </View>
);

const ModuleButton = ({ title, desc, icon: Icon, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.moduleBtn}>
        <View style={styles.moduleIconBox}>
            <Icon size={22} color={Theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.moduleTitle}>{title}</Text>
            <Text style={styles.moduleDesc}>{desc}</Text>
        </View>
        <ArrowRight size={18} color="#475569" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#020617' },
    header: {
        padding: 24,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    headerSub: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(79, 209, 199, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4FD1C7',
    },
    statusText: { color: '#4FD1C7', fontSize: 8, fontWeight: '900' },
    scrollContent: { padding: 24, paddingBottom: 100 },
    diagStrip: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    diagItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    diagLabel: { color: '#475569', fontSize: 10, fontWeight: '900' },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardWrapper: { width: '48%', marginBottom: 16 },
    metricCard: {
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'space-between',
    },
    iconTopLeft: { alignSelf: 'flex-start' },
    metricContent: { alignItems: 'flex-start' },
    metricValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
    metricTitle: {
        color: '#4FD1C7',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    sectionLabel: {
        color: '#475569',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
        marginTop: 16,
    },
    actionColumn: { gap: 12 },
    moduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    moduleIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(79, 209, 199, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    moduleTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    moduleDesc: { color: '#475569', fontSize: 11, marginTop: 2 },
    auditLog: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        alignSelf: 'center',
        opacity: 0.5,
    },
    auditText: {
        color: '#9AE6B4',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

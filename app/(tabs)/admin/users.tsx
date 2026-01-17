
// Pantry Pal Admin Users Screen (Glassmorphism, Reanimated 2+, Modern Layout)
import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    Image,
    Alert,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { UserIcon, UserCog, Activity, CheckCircle, Ban, Search, ShieldCheck, Star, Users } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

// --- BADGE COLORS ---
const ROLE_GRADIENTS: Record<string, string[]> = {
    member: ['#38bdf8', '#2563eb'],
    premium: ['#fbbf24', '#f59e42'],
    moderator: ['#a78bfa', '#7c3aed'],
    admin: ['#f87171', '#ef4444'],
};

// --- USER CARD ---
const UserCard = ({ user, index, onEdit, onToggleStatus, theme }: any) => {
    const anim = useSharedValue(0);
    // Use is_banned if that's the schema, otherwise fallback to banned
    const isBanned = user?.is_banned === true || user?.banned === true;
    React.useEffect(() => {
        anim.value = withSpring(1, { damping: 12, stiffness: 120, mass: 0.8, overshootClamping: false }, undefined);
    }, [anim, index]);
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: anim.value,
        transform: [
            { scale: anim.value },
            { translateY: 15 * (1 - anim.value) },
        ],
    }));
    // Badge
    const badgeColors = ROLE_GRADIENTS[(user.user_role || '').toLowerCase()] || ROLE_GRADIENTS.member;
    return (
        <Animated.View style={[styles.userCard, animatedStyle, isBanned && styles.bannedCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatarGlow, { borderColor: badgeColors[0] }]}>
                    {user.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                    ) : (
                        <UserIcon size={22} color="#475569" />
                    )}
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, isBanned && styles.strikethrough]} numberOfLines={1}>
                        {user.full_name || 'ANONYMOUS'}
                    </Text>
                    <View style={styles.roleRow}>
                        <View style={[styles.roleBadge, { backgroundColor: badgeColors[0] }]}>
                            <ShieldCheck size={12} color="#fff" />
                            <Text style={styles.roleLabel}>{(user.user_role || '').toUpperCase()}</Text>
                        </View>
                        {(user.member_rank || '').toLowerCase() === 'premium' && (
                            <View style={styles.tierBadge}>
                                <Star size={12} color="#fbbf24" />
                                <Text style={styles.tierLabel}>PREMIUM</Text>
                            </View>
                        )}
                    </View>
                </View>
                <TouchableOpacity onPress={onEdit} style={styles.gearBtn}>
                    <UserCog size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardFooter}>
                <View style={styles.subjectMeta}>
                    <Activity size={12} color="#475569" />
                    <Text style={styles.subjectName}>{user.email || 'NO EMAIL'}</Text>
                </View>
                <TouchableOpacity
                    onPress={onToggleStatus}
                    style={[styles.statusBtn, isBanned ? styles.restoreBtn : styles.revokeBtn]}
                >
                    <Text style={[styles.statusBtnText, { color: isBanned ? '#9AE6B4' : '#F87171' }]}>
                        {isBanned ? 'RESTORE' : 'BAN'}
                    </Text>
                    {isBanned ? (
                        <CheckCircle size={14} color="#9AE6B4" />
                    ) : (
                        <Ban size={14} color="#F87171" />
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

// --- MAIN SCREEN ---
export default function AdminUsersScreen() {
    const theme = useTheme();
    // Removed unused width
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Fetch users (only from 'profiles')
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            setUsers(data || []);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUsers();
        }, [loadUsers])
    );

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        return users.filter((u) =>
            (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [search, users]);

    // Ban/Restore
    const handleToggleStatus = async (user: any) => {
        const banned = user.is_banned === true || user.banned === true;
        try {
            const { error } = await supabase.from('profiles').update({ is_banned: !banned }).eq('id', user.id);
            if (error) throw error;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadUsers();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    // Edit (placeholder)
    const handleEdit = (_user: any) => {
        Alert.alert('Edit User', 'Edit modal coming soon.');
    };

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { backgroundColor: theme.colors.glass?.background || theme.colors.background }]}>
                <Text style={styles.title}>Admin Users</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Users size={16} color={theme.colors.primary} />
                        <Text style={styles.statValue}>{users.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Star size={16} color="#fbbf24" />
                        <Text style={styles.statValue}>{users.filter(u => (u.member_rank || '').toLowerCase() === 'premium').length}</Text>
                        <Text style={styles.statLabel}>Premium</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ban size={16} color="#F87171" />
                        <Text style={styles.statValue}>{users.filter(u => u.is_banned === true || u.banned === true).length}</Text>
                        <Text style={styles.statLabel}>Banned</Text>
                    </View>
                </View>
                <View style={styles.searchRow}>
                    <Search size={18} color={theme.colors.primary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#64748b"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>
            <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadUsers} tintColor={theme.colors.primary} />
                }
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                renderItem={({ item, index }) => (
                    <UserCard
                        user={item}
                        index={index}
                        onEdit={() => handleEdit(item)}
                        onToggleStatus={() => handleToggleStatus(item)}
                        theme={theme}
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}><Text style={styles.emptyText}>No users found.</Text></View>
                )}
            />
        </SafeAreaView>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A101F',
    },
    header: {
        paddingTop: 32,
        paddingBottom: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        // React Native does not support backdropFilter
        // If you want blur, use a BlurView component from expo-blur
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statValue: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
        marginLeft: 4,
    },
    statLabel: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 11,
        marginLeft: 4,
        letterSpacing: 1,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginTop: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 8,
        marginLeft: 8,
    },
    userCard: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 20,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    bannedCard: {
        opacity: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarGlow: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.10)',
        marginRight: 14,
    },
    avatarImg: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        marginBottom: 2,
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 6,
    },
    roleLabel: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
        marginLeft: 4,
        letterSpacing: 1,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251,191,36,0.10)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    tierLabel: {
        color: '#fbbf24',
        fontWeight: '800',
        fontSize: 12,
        marginLeft: 4,
        letterSpacing: 1,
    },
    gearBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subjectMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subjectName: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 4,
    },
    statusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
    },
    revokeBtn: {
        backgroundColor: 'rgba(248, 113, 113, 0.04)',
        borderColor: 'rgba(248, 113, 113, 0.15)',
    },
    restoreBtn: {
        backgroundColor: 'rgba(154, 230, 180, 0.04)',
        borderColor: 'rgba(154, 230, 180, 0.15)',
    },
    statusBtnText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 64,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '700',
    },
});

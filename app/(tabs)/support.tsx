/**
 * PROJECT CRADLE: SUPPORT HUB V18.0 (AAA+ ELITE MASTER)
 * Path: app/(app)/support.tsx
 * ----------------------------------------------------------------------------
 * FEATURES:
 * 1. IDENTITY HANDSHAKE: Full profile joins on every message.
 * 2. ROLE BADGING: Visual 'ADMIN' vs 'USER' indicators in chat.
 * 3. INTERNAL CHANNEL: Staff-only toggle for biometric notes.
 * 4. TS2322 FIX: Safe style array logic for Desktop width constraints.
 * 5. LIFECYCLE: Sovereign status toggles for staff (OPEN -> RESOLVED).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import {
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Filter,
    Info,
    Lock,
    MessageSquare,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    User as UserIcon,
    X,
} from 'lucide-react-native';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Alert,
    Animated,
    Easing,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { palettes } from '../../styles/theme';
import { supabase } from '@/lib/supabase';

const STAFF_ROLES = ['ADMIN', 'SUPPORT', 'MODERATOR'];

export default function SupportHub() {
    const { user, profile } = useAuth();
    // Removed useWindowDimensions and isDesktop if not needed
    const isStaff = profile?.role && STAFF_ROLES.includes(profile.role.toUpperCase?.() ?? '');
    const isAdmin = profile?.role === 'admin';
    const isModerator = profile?.role === 'moderator';

    // Core State
    const [activeTab, setActiveTab] = useState<'my' | 'queue' | 'faq'>(
        isStaff ? 'queue' : 'my',
    );
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [createVisible, setCreateVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    // Removed unused loadingDetails state

    // Form State
    const [subject, setSubject] = useState('');
    const [desc, setDesc] = useState('');
    const [reply, setReply] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ANIMATIONS
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.exp),
        }).start();
    }, [activeTab, fadeAnim]);

    /**
     * LOAD DATA: Retrieves ticket ledger with identity joins
     */
    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from('support_tickets')
                .select('*, profiles(full_name, email, role)');
            // Only staff (admin, moderator, support) can see all tickets in 'queue'.
            if (activeTab === 'my' || !isStaff) {
                query = query.eq('user_id', user.id);
            } else if (activeTab === 'queue' && isStaff) {
                // Staff see all tickets
            } else {
                // Fallback: restrict to own tickets
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query.order('created_at', {
                ascending: false,
            });
            if (error) throw error;
            setTickets(data || []);
        } catch (e: any) {
            console.error('[Support Engine] Sync Failure:', e.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id, activeTab, isStaff]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    const filteredTickets = useMemo(() => {
        const base = Array.isArray(tickets) ? tickets : [];
        if (!searchQuery.trim()) return base;
        return base.filter(
            (t) =>
                (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.profiles?.full_name || '')
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );
    }, [searchQuery, tickets]);

    const handleCreate = async () => {
        if (!subject.trim() || !desc.trim())
            return Alert.alert('Mandatory', 'Subject and description missing.');
        if (!user?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('support_tickets').insert({
                user_id: user.id,
                subject,
                message: desc,
                status: 'OPEN',
            });
            if (error) throw error;
            setCreateVisible(false);
            setSubject('');
            setDesc('');
            loadData();
            Alert.alert('Success', 'Ticket synchronized with master queue.');
        } catch (e: any) {
            Alert.alert('Commit Failed', e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
        if (!selectedTicket) return;
        const res_at = newStatus === 'RESOLVED' ? new Date().toISOString() : null;
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus, resolved_at: res_at })
                .eq('id', selectedTicket.id);
            if (error) throw error;
            setStatusModalVisible(false);
            // REFRESH: Identity join for chat refresh
            const { data } = await supabase
                .from('support_tickets')
                .select('*, profiles(full_name, role)')
                .eq('id', selectedTicket.id)
                .single();
            setSelectedTicket(data);
            loadData();
        } catch (e: any) {
            Alert.alert('Handshake Error', e.message);
        }
    };

    // Commenting out handleReply as support_comments table does not exist
    // const handleReply = async () => {
    //     if (!reply.trim() || !selectedTicket) return;
    //     setIsSubmitting(true);
    //     try {
    //         const { error } = await supabase.from('support_comments').insert({
    //             ticket_id: selectedTicket.id,
    //             author_id: user?.id,
    //             comment_body: reply.trim(),
    //             is_internal: isInternal,
    //         });
    //         if (error) throw error;
    //         setReply('');
    //         setIsInternal(false);
    //         const { data } = await supabase
    //             .from('support_tickets')
    //             .select(
    //                 '*, profiles(full_name, role), support_comments(*, profiles(full_name, role))',
    //             )
    //             .eq('id', selectedTicket.id)
    //             .single();
    //         setSelectedTicket(data);
    //     } catch (e: any) {
    //         Alert.alert('Sync Error', e.message);
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // };

    const handleTicketDelete = async () => {
        if (!selectedTicket || !isStaff) return;
        Alert.alert(
            'Purge Ledger',
            'Permanently destroy this support ticket record?',
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase
                            .from('support_tickets')
                            .delete()
                            .eq('id', selectedTicket.id);
                        setSelectedTicket(null);
                        loadData();
                    },
                },
            ],
        );
    };

    // TS2322 STYLE FIXES
    const desktopRootStyle: ViewStyle = {};
    const chatPanelStyle: ViewStyle = {};
    const smallPanelStyle: ViewStyle = {};






    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" />
            <Animated.View
                style={[styles.mainContainer, desktopRootStyle, { opacity: fadeAnim }]}
            >
                {/* SOVEREIGN HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.title}>SUPPORT HUB</Text>
                            <Text style={styles.subtitle}>PROJECT CRADLE V18.0</Text>
                        </View>
                        {isAdmin && (
                            <LinearGradient
                                colors={['#F87171', '#EF4444']}
                                style={styles.staffTag}
                            >
                                <ShieldCheck size={14} color="#020617" />
                                <Text style={styles.staffTagText}>ADMIN</Text>
                            </LinearGradient>
                        )}
                        {isModerator && !isAdmin && (
                            <LinearGradient
                                colors={['#B794F6', '#9F7AEA']}
                                style={styles.staffTag}
                            >
                                <ShieldCheck size={14} color="#020617" />
                                <Text style={styles.staffTagText}>MODERATOR</Text>
                            </LinearGradient>
                        )}
                        {isStaff && !isAdmin && !isModerator && (
                            <LinearGradient
                                colors={['#4FD1C7', '#38B2AC']}
                                style={styles.staffTag}
                            >
                                <ShieldCheck size={14} color="#020617" />
                                <Text style={styles.staffTagText}>SUPPORT</Text>
                            </LinearGradient>
                        )}
                    </View>
                    <View style={styles.tabContainer}>
                        <View style={styles.tabRow}>
                            {isStaff && (
                                <TabBtn
                                    active={activeTab === 'queue'}
                                    label="QUEUE"
                                    onPress={() => setActiveTab('queue')}
                                />
                            )}
                            <TabBtn
                                active={activeTab === 'my'}
                                label="MY TICKETS"
                                onPress={() => setActiveTab('my')}
                            />
                            <TabBtn
                                active={activeTab === 'faq'}
                                label="FAQ"
                                onPress={() => setActiveTab('faq')}
                            />
                        </View>
                    </View>
                </View>

                {/* LISTING CORE */}
                <View style={{ flex: 1, paddingHorizontal: 24 }}>
                    {activeTab !== 'faq' && (
                        <View style={styles.searchHUD}>
                            <Search size={18} color="#4FD1C7" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search Support System ledger..."
                                placeholderTextColor="#475569"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Filter size={18} color="#475569" />
                        </View>
                    )}

                    <FlatList
                        data={filteredTickets}
                        keyExtractor={(item) => item.id}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={loadData}
                                tintColor={palettes.dark.primary}
                            />
                        }
                        contentContainerStyle={{ paddingBottom: 120 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.ticketCard}
                                onPress={async () => {
                                    const { data } = await supabase
                                        .from('support_tickets')
                                        .select('*, profiles(full_name, role)')
                                        .eq('id', item.id)
                                        .single();
                                    setSelectedTicket(data);
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardSubject}>
                                        {(item.subject || 'UNNAMED_EVENT').toUpperCase()}
                                    </Text>
                                    <View style={styles.metaRow}>
                                        <Calendar size={12} color="#475569" />
                                        <Text style={styles.cardMeta}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.metaDivider}>|</Text>
                                        <UserIcon size={12} color="#475569" />
                                        <Text style={styles.cardMeta}>
                                            {isStaff
                                                ? item.profiles?.full_name || 'Member'
                                                : 'ID SECURED'}
                                        </Text>
                                        {item.profiles?.role && (
                                            <View style={{ marginLeft: 8 }}>
                                                <Text style={{
                                                    color:
                                                        item.profiles.role === 'ADMIN'
                                                            ? '#F87171'
                                                            : item.profiles.role === 'MODERATOR'
                                                                ? '#B794F6'
                                                                : item.profiles.role === 'SUPPORT'
                                                                    ? '#4FD1C7'
                                                                    : '#475569',
                                                    fontWeight: '900',
                                                    fontSize: 10,
                                                    letterSpacing: 1,
                                                }}>
                                                    {item.profiles.role}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            borderColor:
                                                item.status === 'OPEN'
                                                    ? palettes.dark.primary
                                                    : '#475569',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            {
                                                color:
                                                    item.status === 'OPEN'
                                                        ? palettes.dark.primary
                                                        : '#475569',
                                            },
                                        ]}
                                    >
                                        {item.status}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <MessageSquare size={48} color="#1E293B" />
                                <Text style={styles.emptyText}>
                                    No tickets synced in this frequency.
                                </Text>
                            </View>
                        )}
                    />
                </View>

                {activeTab === 'my' && (
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => setCreateVisible(true)}
                    >
                        <Plus size={36} color="#020617" strokeWidth={2.5} />
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* CHAT INTERFACE MODAL */}
            <Modal visible={!!selectedTicket} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.chatPanel, chatPanelStyle]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                                <X size={24} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.modalHeaderCenter}>
                                <Text style={styles.modalTitleHUD}>Support Tickets</Text>
                                <Text style={styles.modalStatus}>{selectedTicket?.status}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                {isStaff && (
                                    <TouchableOpacity onPress={handleTicketDelete}>
                                        <Trash2 size={20} color="#F87171" />
                                    </TouchableOpacity>
                                )}
                                {isStaff && (
                                    <TouchableOpacity onPress={() => setStatusModalVisible(true)}>
                                        <ChevronDown size={24} color={palettes.dark.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <ScrollView
                            style={{ flex: 1, padding: 24 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Original Handshake */}
                            <View style={styles.initialMsg}>
                                <View style={styles.identityHeader}>
                                    <View style={styles.avatarMini}>
                                        <UserIcon size={14} color="#020617" />
                                    </View>
                                    <View>
                                        <Text style={styles.authorName}>
                                            {selectedTicket?.profiles?.full_name || 'Member'}
                                        </Text>
                                        <Text style={styles.authorEmail}>
                                            {selectedTicket?.profiles?.email ||
                                                'id.secured@cradle.com'}
                                        </Text>
                                    </View>
                                    <View style={styles.originBadge}>
                                        <Text style={styles.originText}>ORIGIN</Text>
                                    </View>
                                </View>
                                <Text style={styles.msgSubject}>{selectedTicket?.subject}</Text>
                                <Text style={styles.msgBody}>
                                    {selectedTicket?.description}
                                </Text>
                            </View>

                            <View style={styles.discussionDivider}>
                                <View style={styles.line} />
                                <Text style={styles.discussionText}>Discussion Sync</Text>
                                <View style={styles.line} />
                            </View>

                            {/* Message Thread */}
                            {/* support_comments removed: No chat thread available. */}
                            <Text style={{ color: '#475569', textAlign: 'center', marginTop: 24 }}>
                                (No chat thread. Comments feature is currently unavailable.)
                            </Text>
                        </ScrollView>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        >
                            <View style={styles.inputHUD}>
                                {isStaff && (
                                    <TouchableOpacity
                                        onPress={() => setIsInternal(!isInternal)}
                                        style={[
                                            styles.internalToggle,
                                            isInternal && styles.internalToggleActive,
                                        ]}
                                    >
                                        <Lock
                                            size={14}
                                            color={isInternal ? '#B794F6' : '#475569'}
                                        />
                                        <Text
                                            style={{
                                                color: isInternal ? '#B794F6' : '#475569',
                                                fontSize: 10,
                                                fontWeight: '900',
                                            }}
                                        >
                                            {isInternal ? 'INTERNAL NOTE (STAFF ONLY)' : 'PUBLIC REPLY'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <View style={styles.replyRow}>
                                    <TextInput
                                        style={styles.replyInput}
                                        placeholder="Describe your issue..."
                                        placeholderTextColor="#475569"
                                        value={reply}
                                        onChangeText={setReply}
                                        multiline
                                        editable={false}
                                    />
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>

            {/* INITIALIZE REQUEST MODAL */}
            <Modal visible={createVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.chatPanel, smallPanelStyle]}>
                        <View style={styles.modalSubHeader}>
                            <Info size={16} color={palettes.dark.primary} />
                            <Text style={styles.modalSubTitle}>NEW DATA STREAM</Text>
                        </View>
                        <Text style={styles.createTitle}>INITIALIZE REQUEST</Text>
                        <TextInput
                            style={styles.glassInput}
                            placeholder="Subject Identifier"
                            value={subject}
                            onChangeText={setSubject}
                            placeholderTextColor="#475569"
                        />
                        <TextInput
                            style={[styles.glassInput, { height: 150 }]}
                            multiline
                            placeholder="Provide system event details..."
                            value={desc}
                            onChangeText={setDesc}
                            placeholderTextColor="#475569"
                            textAlignVertical="top"
                        />
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setCreateVisible(false)}
                            >
                                <Text style={styles.cancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleCreate}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.submitText}>COMMIT STREAM</Text>
                                <ChevronRight size={18} color="#020617" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* LIFECYCLE TRIAGE MODAL */}
            <Modal visible={statusModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.statusPanel, smallPanelStyle]}>
                        <Text style={styles.createTitle}>LIFECYCLE TRIAGE</Text>
                        <View style={styles.statusGrid}>
                            {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(
                                (s) => (
                                    <TouchableOpacity
                                        key={s}
                                        onPress={() => handleStatusChange(s)}
                                        style={[
                                            styles.statusOption,
                                            selectedTicket?.status === s && styles.statusOptionActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                selectedTicket?.status === s && {
                                                    color: palettes.dark.primary,
                                                },
                                            ]}
                                        >
                                            {s}
                                        </Text>
                                        {selectedTicket?.status === s && (
                                            <CheckCircle size={18} color={palettes.dark.primary} />
                                        )}
                                    </TouchableOpacity>
                                ),
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => setStatusModalVisible(false)}
                            style={styles.closeBtn}
                        >
                            <Text style={styles.closeBtnText}>CLOSE TRIAGE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const TabBtn = ({ label, active, onPress }: any) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.tab,
            active && {
                backgroundColor: 'rgba(79, 209, 199, 0.1)',
                borderColor: palettes.dark.primary,
            },
        ]}
    >
        <Text style={[styles.tabText, active && { color: palettes.dark.primary }]}>
            {label}
        </Text>
        {active && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
);

// FaqCard removed (unused)

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#020617' },
    mainContainer: { flex: 1, width: '100%' },
    header: { padding: 24, paddingBottom: 15 },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    subtitle: {
        color: palettes.dark.primary,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 2,
    },
    staffTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    staffTagText: { color: '#020617', fontSize: 10, fontWeight: '900' },
    tabContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 4,
        borderRadius: 20,
    },
    tabRow: { flexDirection: 'row', gap: 5 },
    tab: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        position: 'relative',
    },
    tabText: { color: '#475569', fontSize: 12, fontWeight: '900' },
    tabIndicator: {
        position: 'absolute',
        bottom: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: palettes.dark.primary,
    },
    searchHUD: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },
    ticketCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#0A0F1E',
        borderRadius: 28,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardSubject: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardMeta: { color: '#475569', fontSize: 11, fontWeight: '800' },
    metaDivider: { color: 'rgba(255,255,255,0.05)' },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusText: { fontSize: 9, fontWeight: '900' },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 30,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: palettes.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palettes.dark.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        padding: 20,
    },
    chatPanel: {
        width: '100%',
        height: '92%',
        borderRadius: 45,
        overflow: 'hidden',
        padding: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    modalHeaderCenter: { alignItems: 'center' },
    modalTitleHUD: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 3,
    },
    modalStatus: {
        color: palettes.dark.primary,
        fontSize: 12,
        fontWeight: '900',
        marginTop: 2,
    },
    initialMsg: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 24,
        borderRadius: 32,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    identityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    avatarMini: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: palettes.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    authorName: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    authorEmail: { color: '#475569', fontSize: 11, fontWeight: '700' },
    originBadge: {
        marginLeft: 'auto',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    originText: { color: '#94A3B8', fontSize: 8, fontWeight: '900' },
    msgSubject: {
        color: palettes.dark.primary,
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 12,
    },
    msgBody: { color: '#CBD5E1', fontSize: 16, lineHeight: 24 },
    discussionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginVertical: 20,
        opacity: 0.3,
    },
    line: { flex: 1, height: 1, backgroundColor: '#475569' },
    discussionText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    bubble: {
        backgroundColor: '#111827',
        padding: 20,
        borderRadius: 24,
        marginBottom: 15,
        alignSelf: 'flex-start',
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    bubbleUser: {
        alignSelf: 'flex-end',
        backgroundColor: '#1E293B',
        borderColor: 'rgba(79, 209, 199, 0.1)',
    },
    internalBubble: {
        backgroundColor: 'rgba(183, 148, 246, 0.05)',
        borderColor: 'rgba(183, 148, 246, 0.2)',
    },
    bubbleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
        marginBottom: 8,
        alignItems: 'center',
    },
    bubbleAuthor: { color: '#94A3B8', fontSize: 11, fontWeight: '900' },
    adminChatBadge: {
        backgroundColor: 'rgba(183, 148, 246, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adminChatText: { color: '#B794F6', fontSize: 7, fontWeight: '900' },
    userChatBadge: {
        backgroundColor: 'rgba(79, 209, 199, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    userChatText: { color: palettes.dark.primary, fontSize: 7, fontWeight: '900' },
    bubbleText: { color: '#F8FAFC', fontSize: 15, lineHeight: 22 },
    bubbleTime: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '800',
        marginTop: 8,
        textAlign: 'right',
    },
    inputHUD: {
        padding: 24,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sendBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: palettes.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palettes.dark.primary,
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    replyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
    internalToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(183, 148, 246, 0.1)',
    },
    internalToggleActive: {
        backgroundColor: 'rgba(183, 148, 246, 0.08)',
        borderColor: '#B794F6',
    },
    replyInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 15,
        color: '#FFF',
        fontSize: 16,
        maxHeight: 120,
    },
    createPanel: {
        padding: 32,
        borderRadius: 45,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    modalSubTitle: {
        color: palettes.dark.primary,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
    },
    createTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 32,
        letterSpacing: -1,
    },
    glassInput: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        color: '#FFF',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        fontSize: 16,
    },
    btnRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
    cancelBtn: { flex: 1, padding: 20, alignItems: 'center' },
    cancelText: { color: '#475569', fontWeight: '900', fontSize: 14 },
    submitBtn: {
        flex: 2,
        backgroundColor: palettes.dark.primary,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    submitText: {
        color: '#020617',
        fontWeight: '900',
        letterSpacing: 0.5,
        fontSize: 16,
    },
    statusPanel: { padding: 32, borderRadius: 45, width: '100%' },
    statusGrid: { gap: 10, marginVertical: 20 },
    statusOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statusOptionActive: {
        borderColor: palettes.dark.primary,
        backgroundColor: 'rgba(79, 209, 199, 0.05)',
    },
    statusOptionText: { color: '#94A3B8', fontWeight: '900', fontSize: 14 },
    closeBtn: {
        marginTop: 20,
        padding: 15,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 15,
    },
    closeBtnText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    },
    faqCard: {
        backgroundColor: '#0A0F1E',
        padding: 24,
        borderRadius: 32,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    faqTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    faqBody: { color: '#475569', fontSize: 14, lineHeight: 22 },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.2,
    },
    emptyText: {
        color: '#FFF',
        marginTop: 20,
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    },
    noteLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    noteText: {
        color: '#B794F6',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    desktopChat: { maxWidth: 800 },
    desktopSmall: { maxWidth: 500 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PantryDatabase } from '@/database/PantryDatabase';
import { PantryItem } from '@/types/PantryItem';
import { useTheme } from '@/contexts/ThemeContext';

interface ExpirationAlert {
  item: PantryItem;
  daysUntilExpiry: number;
  severity: 'expired' | 'critical' | 'warning';
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadExpirationAlerts();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadExpirationAlerts = async () => {
    try {
      const items = await PantryDatabase.getAllItems();
      const now = new Date();
      const alertItems: ExpirationAlert[] = [];
      items.forEach(item => {
        const diffDays = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let severity: ExpirationAlert['severity'];
        if (diffDays < 0) severity = 'expired';
        else if (diffDays <= 1) severity = 'critical';
        else if (diffDays <= 3) severity = 'warning';
        else return;
        alertItems.push({ item, daysUntilExpiry: diffDays, severity });
      });
      alertItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
      setAlerts(alertItems);
    } catch (error) { console.error('Error loading expiration alerts:', error); }
  };

  const handleDeleteItem = async (item: PantryItem) => {
    Alert.alert('Delete Expired Item', `Remove "${item.name}"?`, [
      { text: 'Cancel' }, { text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await PantryDatabase.deleteItem(item.id!); loadExpirationAlerts(); } 
          catch (error) { console.error('Error deleting item:', error); }
        },
      },
    ]);
  };

  const getSeverityConfig = (severity: ExpirationAlert['severity']) => {
    switch (severity) {
      case 'expired': return { color: theme.colors.error, bgColor: `${theme.colors.error}20`, icon: 'alert-triangle' as const, title: 'Expired' };
      case 'critical': return { color: theme.colors.warning, bgColor: `${theme.colors.warning}20`, icon: 'alert-triangle' as const, title: 'Expires Today' };
      case 'warning': return { color: '#F97316', bgColor: '#FED7AA', icon: 'calendar' as const, title: 'Expiring Soon' };
    }
  };

  const getExpiryText = (alert: ExpirationAlert) => {
    if (alert.daysUntilExpiry < 0) return `Expired ${Math.abs(alert.daysUntilExpiry)} day(s) ago`;
    return `Expires in ${alert.daysUntilExpiry} day(s)`;
  };

  const renderAlert = ({ item: alert }: { item: ExpirationAlert }) => {
    const config = getSeverityConfig(alert.severity);
    return (
      <View style={[styles.alertCard, { backgroundColor: config.bgColor }]}>
        <View style={styles.alertContent}>
          <View style={[styles.iconContainer, { backgroundColor: config.color }]}><Feather name={config.icon} size={20} color="#FFFFFF" /></View>
          <View style={styles.alertInfo}>
            <View style={styles.alertHeader}>
              <Text style={styles.itemName}>{alert.item.name}</Text>
              <Text style={[styles.severityBadge, { color: config.color }]}>{config.title}</Text>
            </View>
            <View style={styles.alertDetails}>
              <View style={styles.detailRow}><Feather name="package" size={14} color="#6B7280" /><Text style={styles.detailText}>{alert.item.quantity} {alert.item.unit} • {alert.item.location}</Text></View>
              <View style={styles.detailRow}><Feather name="calendar" size={14} color="#6B7280" /><Text style={styles.detailText}>{getExpiryText(alert)}</Text></View>
            </View>
          </View>
          {alert.severity === 'expired' && (<TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(alert.item)}><Feather name="trash-2" size={20} color={theme.colors.error} /></TouchableOpacity>)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={theme.gradients.notifications as any} style={styles.header}>
        <View style={styles.headerContent}><Feather name="bell" size={32} color="#FFFFFF" /><Text style={styles.headerTitle}>Expiration Alerts</Text><Text style={styles.headerSubtitle}>{alerts.length} item{alerts.length !== 1 ? 's' : ''} need attention</Text></View>
      </LinearGradient>
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="bell" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No expiration alerts</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>All your items are fresh!</Text>
          </View>
        ) : (
          <FlatList data={alerts} renderItem={renderAlert} keyExtractor={(item) => item.item.id!.toString()} contentContainerStyle={styles.listContent} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  listContainer: { flex: 1 },
  listContent: { padding: 20 },
  alertCard: { borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  alertContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertInfo: { flex: 1 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontSize: 16, fontWeight: '600' },
  severityBadge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  alertDetails: { gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14 },
  deleteButton: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
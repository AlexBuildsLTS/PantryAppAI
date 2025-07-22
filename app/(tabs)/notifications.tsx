import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, TriangleAlert as AlertTriangle, Calendar, Package, Trash2 } from 'lucide-react-native';
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

    // Set up interval to refresh alerts every hour
    const interval = setInterval(loadExpirationAlerts, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadExpirationAlerts = async () => {
    try {
      const items = await PantryDatabase.getAllItems();
      const now = new Date();
      
      const alertItems: ExpirationAlert[] = [];

      items.forEach(item => {
        const expiryDate = new Date(item.expiryDate);
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let severity: 'expired' | 'critical' | 'warning';
        
        if (diffDays < 0) {
          severity = 'expired';
        } else if (diffDays <= 1) {
          severity = 'critical';
        } else if (diffDays <= 3) {
          severity = 'warning';
        } else {
          return; // Don't include items that expire more than 3 days from now
        }

        alertItems.push({
          item,
          daysUntilExpiry: diffDays,
          severity,
        });
      });

      // Sort by urgency (expired first, then by days until expiry)
      alertItems.sort((a, b) => {
        if (a.severity === 'expired' && b.severity !== 'expired') return -1;
        if (b.severity === 'expired' && a.severity !== 'expired') return 1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      setAlerts(alertItems);
    } catch (error) {
      console.error('Error loading expiration alerts:', error);
    }
  };

  const handleDeleteItem = async (item: PantryItem) => {
    Alert.alert(
      'Delete Expired Item',
      `Remove "${item.name}" from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PantryDatabase.deleteItem(item.id!);
              loadExpirationAlerts();
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          },
        },
      ]
    );
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'expired':
        return {
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: AlertTriangle,
          title: 'Expired',
        };
      case 'critical':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: AlertTriangle,
          title: 'Expires Today',
        };
      case 'warning':
        return {
          color: '#F97316',
          bgColor: '#FED7AA',
          icon: Calendar,
          title: 'Expiring Soon',
        };
      default:
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: Calendar,
          title: 'Unknown',
        };
    }
  };

  const getExpiryText = (alert: ExpirationAlert) => {
    if (alert.daysUntilExpiry < 0) {
      const daysPast = Math.abs(alert.daysUntilExpiry);
      return `Expired ${daysPast} day${daysPast > 1 ? 's' : ''} ago`;
    } else if (alert.daysUntilExpiry === 0) {
      return 'Expires today';
    } else {
      return `Expires in ${alert.daysUntilExpiry} day${alert.daysUntilExpiry > 1 ? 's' : ''}`;
    }
  };

  const renderAlert = ({ item: alert, index }: { item: ExpirationAlert; index: number }) => {
    const config = getSeverityConfig(alert.severity);
    const scaleAnim = new Animated.Value(0);

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={[
          styles.alertCard,
          { 
            backgroundColor: config.bgColor,
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.alertContent}>
          <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
            <config.icon size={20} color="#FFFFFF" />
          </View>
          
          <View style={styles.alertInfo}>
            <View style={styles.alertHeader}>
              <Text style={styles.itemName}>{alert.item.name}</Text>
              <Text style={[styles.severityBadge, { color: config.color }]}>
                {config.title}
              </Text>
            </View>
            
            <View style={styles.alertDetails}>
              <View style={styles.detailRow}>
                <Package size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {alert.item.quantity} {alert.item.unit} • {alert.item.location}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {getExpiryText(alert)}
                </Text>
              </View>
            </View>
          </View>
          
          {alert.severity === 'expired' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(alert.item)}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  const expiredCount = alerts.filter(alert => alert.severity === 'expired').length;
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
  const warningCount = alerts.filter(alert => alert.severity === 'warning').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient 
        colors={theme.gradients.primary as any}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Bell size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Expiration Alerts</Text>
          <Text style={styles.headerSubtitle}>
            {alerts.length} item{alerts.length !== 1 ? 's' : ''} need attention
          </Text>
        </View>
      </LinearGradient>

      {alerts.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: theme.colors.error }]} />
              <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>{expiredCount} Expired</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>{criticalCount} Critical</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#F97316' }]} />
              <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>{warningCount} Warning</Text>
            </View>
          </View>
        </View>
      )}

      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No expiration alerts</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              All your items are fresh! We'll notify you when items are about to expire.
            </Text>
          </View>
        ) : (
          <FlatList
            data={alerts}
            renderItem={renderAlert}
            keyExtractor={(item) => item.item.id!.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  alertCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
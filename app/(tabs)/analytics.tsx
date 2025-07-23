import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Fix: Remove unused import
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'; // Fix: Import icons from @expo/vector-icons
import { LinearGradient } from 'expo-linear-gradient';
import { PantryDatabase } from '@/database/PantryDatabase';
import { PantryItem } from '@/types/PantryItem';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Analytics {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  locationBreakdown: { [key: string]: number };
  monthlyTrends: { month: string; added: number; expired: number }[];
  estimatedValue: number;
  wasteReduction: number;
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAnalytics();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadAnalytics = async () => {
    try {
      const items = await PantryDatabase.getAllItems();
      const now = new Date();

      // Calculate basic stats
      const totalItems = items.length;
      const expiringItems = items.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      }).length;

      const expiredItems = items.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        return expiryDate < now;
      }).length;

      // Location breakdown
      const locationBreakdown = items.reduce((acc, item) => {
        acc[item.location] = (acc[item.location] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Mock monthly trends (in a real app, this would be calculated from historical data)
      const monthlyTrends = [
        { month: 'Jan', added: 15, expired: 3 },
        { month: 'Feb', added: 22, expired: 5 },
        { month: 'Mar', added: 18, expired: 2 },
        { month: 'Apr', added: 25, expired: 4 },
        { month: 'May', added: 20, expired: 1 },
        { month: 'Jun', added: 28, expired: 6 },
      ];

      // Estimated value (mock calculation)
      const estimatedValue = items.reduce((total, item) => {
        const basePrice = getEstimatedPrice(item.name);
        return total + (basePrice * item.quantity);
      }, 0);

      // Waste reduction percentage (mock calculation)
      const wasteReduction = Math.max(0, 100 - (expiredItems / Math.max(totalItems, 1)) * 100);

      setAnalytics({
        totalItems,
        expiringItems,
        expiredItems,
        locationBreakdown,
        monthlyTrends,
        estimatedValue,
        wasteReduction,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const getEstimatedPrice = (itemName: string): number => {
    // Mock price estimation based on item name
    const priceMap: { [key: string]: number } = {
      milk: 3.50,
      bread: 2.50,
      eggs: 4.00,
      cheese: 5.00,
      chicken: 8.00,
      beef: 12.00,
      rice: 2.00,
      pasta: 1.50,
    };

    const lowerName = itemName.toLowerCase();
    for (const [key, price] of Object.entries(priceMap)) {
      if (lowerName.includes(key)) {
        return price;
      }
    }
    return 3.00; // Default price
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    trend 
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: string;
    trend?: 'up' | 'down';
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Icon size={24} color={color} />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            {trend === 'up' ? ( // Fix: Use Feather icon for trending up
              <Feather name="trending-up" size={16} color="#22C55E" />
            ) : (
              <Feather name="trending-down" size={16} color="#EF4444" />
            )}
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const LocationChart = ({ data }: { data: { [key: string]: number } }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444'];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Items by Location</Text>
        <View style={styles.pieChart}>
          {Object.entries(data).map(([location, count], index) => {
            const percentage = (count / total) * 100;
            return (
              <View key={location} style={styles.chartItem}>
                <View style={styles.chartRow}>
                  <View style={[styles.chartDot, { backgroundColor: colors[index % colors.length] }]} />
                  <Text style={styles.chartLabel}>{location}</Text>
                  <Text style={styles.chartValue}>{count} items</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${percentage}%`,
                        backgroundColor: colors[index % colors.length]
                      }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!analytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.primary as any}
        start={[0, 0]}
        end={[1, 1]}
        locations={[0, 0.8]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Feather name="bar-chart-2" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Insights into your food management
          </Text>
        </View>
      </LinearGradient>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={analytics.totalItems.toString()}
            subtitle="In your pantry"
            icon={Feather}
            color={theme.colors.success}
            trend="up"
          />
          <StatCard
            title="Expiring Soon"
            value={analytics.expiringItems.toString()}
            subtitle="Next 3 days"
            icon={Feather}
            color={theme.colors.warning}
          />
          <StatCard
            title="Estimated Value"
            value={`$${analytics.estimatedValue.toFixed(0)}`}
            subtitle="Current inventory"
            icon={Feather}
            color={theme.colors.secondary}
            trend="up"
          />
          <StatCard
            title="Waste Reduction"
            value={`${analytics.wasteReduction.toFixed(0)}%`}
            subtitle="vs. average household"
            icon={Feather}
            color={theme.colors.success}
            trend="up"
          />
        </View>

        <LocationChart data={analytics.locationBreakdown} />

        <View style={styles.trendsContainer}>
          <Text style={styles.sectionTitle}>Monthly Trends</Text>
          <View style={styles.trendsChart}>
            {analytics.monthlyTrends.map((month, index) => (
              <View key={month.month} style={styles.trendBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      styles.addedBar,
                      { height: (month.added / 30) * 100 }
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.expiredBar,
                      { height: (month.expired / 30) * 100 }
                    ]}
                  />
                </View>
                <Text style={styles.monthLabel}>{month.month}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Added</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Expired</Text>
            </View>
          </View>
        </View>

        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="leaf" size={24} color={theme.colors.success} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Great job reducing waste!</Text>
              <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>
                You're preventing {analytics.wasteReduction.toFixed(0)}% more food waste than the average household.
              </Text>
            </View>
          </View>
          
          {analytics.expiringItems > 0 && (
            <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
              <Feather name="alert-triangle" size={24} color={theme.colors.warning} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Items expiring soon</Text>
                <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>
                  You have {analytics.expiringItems} item{analytics.expiringItems > 1 ? 's' : ''} expiring in the next 3 days. Check your notifications!
                </Text>
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    padding: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  pieChart: {
    gap: 12,
  },
  chartItem: {
    gap: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  chartValue: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendsContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  trendsChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  addedBar: {
    backgroundColor: '#22C55E',
  },
  expiredBar: {
    backgroundColor: '#EF4444',
  },
  monthLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
  },
  insightsContainer: {
    marginBottom: 32,
  },
  insightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
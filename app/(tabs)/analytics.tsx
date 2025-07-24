import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { PantryDatabase } from '@/database/PantryDatabase';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  estimatedValue: number;
  wasteReduction: number;
  locationBreakdown: {
    name: string;
    count: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }[];
  monthlyTrends: { labels: string[]; datasets: { data: number[] }[] };
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const screenOpacity = useSharedValue(0);

  useEffect(() => {
    loadAnalytics();
    screenOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedScreenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const loadAnalytics = async () => {
    try {
      const items = await PantryDatabase.getAllItems();
      const now = new Date();
      const totalItems = items.length;
      const expiringItems = items.filter((item) => {
        const diffDays = Math.ceil(
          (new Date(item.expiryDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return diffDays <= 3 && diffDays >= 0;
      }).length;
      const expiredItems = items.filter(
        (item) => new Date(item.expiryDate) < now
      ).length;

      // Mock estimated value and waste reduction from your original code
      const estimatedValue = items.reduce(
        (total, item) => total + 3.5 * item.quantity,
        0
      );
      const wasteReduction = Math.max(
        0,
        100 - (expiredItems / Math.max(totalItems, 1)) * 100
      );

      // Location Breakdown for Pie Chart
      const locationCounts = items.reduce((acc, item) => {
        acc[item.location] = (acc[item.location] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const locationColors: { [key: string]: string } = {
        Fridge: '#3B82F6',
        Pantry: '#F59E0B',
        Freezer: '#8B5CF6',
      };
      const locationBreakdown = Object.entries(locationCounts).map(
        ([name, count]) => ({
          name,
          count,
          color: locationColors[name] || '#6B7280',
          legendFontColor: theme.colors.textSecondary,
          legendFontSize: 14,
        })
      );

      // Monthly Trends for Bar Chart
      const monthlyTrends = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ data: [15, 22, 18, 25, 20, 28] }],
      };

      setAnalytics({
        totalItems,
        expiringItems,
        expiredItems,
        estimatedValue,
        wasteReduction,
        locationBreakdown,
        monthlyTrends,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const StatCard = ({
    title,
    value,
    iconName,
    color,
  }: {
    title: string;
    value: string;
    iconName: React.ComponentProps<typeof Feather>['name'];
    color: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.statContent}>
        <View
          style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}
        >
          <Feather name={iconName} size={20} color={color} />
        </View>
        <View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {value}
          </Text>
          <Text
            style={[styles.statTitle, { color: theme.colors.textSecondary }]}
          >
            {title}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!analytics) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>Loading Analytics...</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.text,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.8,
    useShadowColorFromDataset: false,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.primary },
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={theme.gradients.analytics as any}
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
        style={[styles.content, animatedScreenStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={analytics.totalItems.toString()}
            iconName="package"
            color={theme.colors.success}
          />
          <StatCard
            title="Expiring Soon"
            value={analytics.expiringItems.toString()}
            iconName="alert-triangle"
            color={theme.colors.warning}
          />
          <StatCard
            title="Estimated Value"
            value={`$${analytics.estimatedValue.toFixed(0)}`}
            iconName="dollar-sign"
            color={theme.colors.secondary}
          />
          <StatCard
            title="Waste Reduction"
            value={`${analytics.wasteReduction.toFixed(0)}%`}
            iconName="feather"
            color={theme.colors.primary}
          />
        </View>

        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Monthly Items Added
          </Text>
          <BarChart
            data={analytics.monthlyTrends}
            width={width - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero
          />
        </View>

        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Items by Location
          </Text>
          <PieChart
            data={analytics.locationBreakdown}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor={'count'}
            backgroundColor={'transparent'}
            paddingLeft={'15'}
            center={[10, 0]}
            absolute
          />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { alignItems: 'center' },
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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statContent: { alignItems: 'flex-start' },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statTitle: { fontSize: 14, fontWeight: '600' },
  chartContainer: {
    borderRadius: 16,
    padding: 10,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingLeft: 10,
    marginBottom: 8,
  },
});

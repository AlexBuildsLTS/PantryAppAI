import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { PantryDatabase } from '@/database/PantryDatabase';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Define the structure for our analytics data
interface AnalyticsData {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  estimatedValue: number;
  wasteReduction: number;
  locationBreakdown: { name: string; count: number; color: string; legendFontColor: string; legendFontSize: number; }[];
  monthlyTrends: { labels: string[]; datasets: { data: number[] }[] };
}

// Reusable animated Stat Card component
const StatCard = ({ title, value, iconName, color, index }: { 
  title: string; 
  value: string; 
  iconName: React.ComponentProps<typeof Feather>['name']; 
  color: string; 
  index: number; 
}) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(index * 100, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }, animatedStyle]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={iconName} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      </View>
    </Animated.View>
  );
};

export default function AnalyticsScreen() {
  const { theme, isDark } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  
  // Animation values
  const headerTranslateY = useSharedValue(-50);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadAnalytics();
    
    // Start animations
    headerTranslateY.value = withTiming(0, { 
      duration: 800, 
      easing: Easing.out(Easing.cubic) 
    });
    
    contentOpacity.value = withTiming(1, { 
      duration: 800,
      easing: Easing.out(Easing.cubic)
    });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }]
  }));
  
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value
  }));

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Skip real database access on web
      if (Platform.OS === 'web') {
        // Use attractive mock data for web
        setAnalytics({
          totalItems: 28,
          expiringItems: 5,
          expiredItems: 2,
          estimatedValue: 145,
          wasteReduction: 93,
          locationBreakdown: [
            { name: 'Fridge (12)', count: 12, color: '#3B82F6', legendFontColor: theme.colors.textSecondary, legendFontSize: 12 },
            { name: 'Pantry (10)', count: 10, color: '#F59E0B', legendFontColor: theme.colors.textSecondary, legendFontSize: 12 },
            { name: 'Freezer (6)', count: 6, color: '#8B5CF6', legendFontColor: theme.colors.textSecondary, legendFontSize: 12 },
          ],
          monthlyTrends: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [{ data: [15, 22, 18, 25, 20, 28] }],
          }
        });
        setIsUsingMockData(true);
        setLoading(false);
        return;
      }
      
      // Normal database access for mobile
      const items = await PantryDatabase.getAllItems();
      const now = new Date();
      
      const totalItems = items.length;
      const expiringItems = items.filter(item => {
        const diffDays = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      }).length;
      
      const expiredItems = items.filter(item => new Date(item.expiryDate) < now).length;
      const estimatedValue = items.reduce((total, item) => total + (item.quantity * 3.50), 0);
      const wasteReduction = Math.max(0, 100 - (expiredItems / Math.max(totalItems, 1)) * 100);
      
      const locationCounts = items.reduce((acc, item) => {
        acc[item.location] = (acc[item.location] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      const locationColors: { [key: string]: string } = { 
        Fridge: '#3B82F6', 
        Pantry: '#F59E0B', 
        Freezer: '#8B5CF6', 
        Other: '#6B7280' 
      };
      
      const locationBreakdown = Object.entries(locationCounts).map(([name, count]) => ({
        name: `${name} (${count})`,
        count,
        color: locationColors[name] || '#6B7280',
        legendFontColor: theme.colors.textSecondary,
        legendFontSize: 12,
      }));
      
      const monthlyTrends = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ data: [15, 22, 18, 25, 20, 28] }],
      };
      
      setAnalytics({ 
        totalItems, 
        expiringItems, 
        expiredItems, 
        estimatedValue, 
        wasteReduction, 
        locationBreakdown, 
        monthlyTrends 
      });
      
      setIsUsingMockData(false);
    } catch (error) { 
      console.error('Error loading analytics:', error);
      // Fallback for any errors
      setAnalytics({
        totalItems: 0,
        expiringItems: 0,
        expiredItems: 0,
        estimatedValue: 0,
        wasteReduction: 100,
        locationBreakdown: [],
        monthlyTrends: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
        }
      });
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Analyzing your pantry data...</Text>
      </View>
    );
  }

  if (!analytics) {
    return null;
  }

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => isDark 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: { 
      borderRadius: 16 
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.colors.primary
    },
    propsForBackgroundLines: {
      strokeDasharray: '6, 6',
      strokeWidth: 1,
      stroke: theme.colors.border,
    },
    formatTopBarValue: (value: number) => `${value}`,
    useShadowColorFromDataset: false,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={headerAnimatedStyle}>
        <LinearGradient colors={theme.gradients.analytics as any} style={styles.header}>
          <View style={styles.headerContent}>
            <Feather name="bar-chart-2" size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Insights into your food management</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {isUsingMockData && Platform.OS === 'web' && (
        <View style={[styles.mockDataBanner, { backgroundColor: theme.colors.warning + '20' }]}>
          <Text style={[styles.mockDataText, { color: theme.colors.warning }]}>
            ⓘ Using demo data for web preview
          </Text>
        </View>
      )}

      <Animated.ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={contentAnimatedStyle}
      >
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Items" 
            value={analytics.totalItems.toString()} 
            iconName="package" 
            color={theme.colors.success} 
            index={0} 
          />
          <StatCard 
            title="Expiring Soon" 
            value={analytics.expiringItems.toString()} 
            iconName="alert-triangle" 
            color={theme.colors.warning} 
            index={1}
          />
          <StatCard 
            title="Estimated Value" 
            value={`$${analytics.estimatedValue.toFixed(0)}`} 
            iconName="dollar-sign" 
            color={theme.colors.secondary} 
            index={2} 
          />
          <StatCard 
            title="Waste Reduction" 
            value={`${analytics.wasteReduction.toFixed(0)}%`} 
            iconName="refresh-ccw" 
            color={theme.colors.primary} 
            index={3} 
          />
        </View>

        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Monthly Items Added</Text>
            <TouchableOpacity style={styles.chartAction}>
              <Text style={[styles.chartActionText, { color: theme.colors.primary }]}>Details</Text>
            </TouchableOpacity>
          </View>
          <BarChart 
            data={analytics.monthlyTrends} 
            width={width - 40} 
            height={220} 
            yAxisLabel="" 
            yAxisSuffix="" 
            chartConfig={chartConfig} 
            fromZero 
            withInnerLines
          />
        </View>

        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Items by Location</Text>
          </View>
          {analytics.locationBreakdown.length > 0 ? (
            <PieChart 
              data={analytics.locationBreakdown} 
              width={width - 40} 
              height={220} 
              chartConfig={chartConfig} 
              accessor={"count"} 
              backgroundColor={"transparent"} 
              paddingLeft={"15"} 
              center={[10, 0]} 
              absolute 
            />
          ) : (
            <View style={styles.emptyDataContainer}>
              <Feather name="pie-chart" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyDataText, { color: theme.colors.textSecondary }]}>
                Add items to your pantry to see a breakdown by location
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Coming Soon
          </Text>
          <View style={styles.comingSoonGrid}>
            <View style={[styles.comingSoonCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.comingSoonIcon, { backgroundColor: '#8B5CF620' }]}>
                <Feather name="trending-up" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.comingSoonTitle, { color: theme.colors.text }]}>Budget Tracking</Text>
              <Text style={[styles.comingSoonDescription, { color: theme.colors.textSecondary }]}>
                Set budgets and track your grocery spending over time
              </Text>
            </View>
            
            <View style={[styles.comingSoonCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.comingSoonIcon, { backgroundColor: '#EC489920' }]}>
                <Feather name="activity" size={24} color="#EC4899" />
              </View>
              <Text style={[styles.comingSoonTitle, { color: theme.colors.text }]}>Nutrition Insights</Text>
              <Text style={[styles.comingSoonDescription, { color: theme.colors.textSecondary }]}>
                Analyze nutritional content in your pantry
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 24, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24 
  },
  headerContent: { 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#FFFFFF', 
    marginTop: 8 
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255, 255, 255, 0.8)', 
    marginTop: 4 
  },
  mockDataBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  mockDataText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: { 
    padding: 20, 
    paddingBottom: 40 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16 
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  statCard: { 
    width: '48%', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5 
  },
  statIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statValue: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 2 
  },
  statTitle: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  chartContainer: { 
    borderRadius: 16, 
    paddingVertical: 16, 
    marginBottom: 24, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8
  },
  chartTitle: { 
    fontSize: 18, 
    fontWeight: '700'
  },
  chartAction: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  chartActionText: {
    fontSize: 14,
    fontWeight: '600'
  },
  emptyDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 250
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4
  },
  comingSoonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  comingSoonCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5
  },
  comingSoonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4
  },
  comingSoonDescription: {
    fontSize: 13,
    lineHeight: 18
  }
});
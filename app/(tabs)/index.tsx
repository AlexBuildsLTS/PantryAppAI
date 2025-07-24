// app/(tabs)/index.tsx
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Vibration,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AIFoodScanner } from '@/components/AIFoodScanner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PantryDatabase } from '@/database/PantryDatabase';
import { AddItemModal } from '@/components/AddItemModal';
import { PantryItem } from '@/types/PantryItem';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// PantryItemCard component to improve code organization and reduce prop drilling
const PantryItemCard = ({
  item,
  onEdit,
  onDelete,
  theme,
}: {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: number) => void;
  theme: any;
}) => {
  const expirationStatus = getExpirationStatus(item.expiryDate, theme);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: expirationStatus.bgColor,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }
    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onDelete(item.id!);
  };

  return (
    <Animated.View style={[styles.itemCard, animatedStyle]}>
      <TouchableOpacity
        onPress={() => onEdit(item)}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.itemContent}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: expirationStatus.color },
            ]}
          >
            <Text style={styles.statusText}>{expirationStatus.status}</Text>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Feather
              name="package"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              {item.quantity} {item.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name="map-pin"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              {item.location}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name="calendar"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Helper function moved outside to reduce component complexity
const getExpirationStatus = (expiryDate: string, theme: any) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return {
      status: 'Expired',
      color: theme.colors.error,
      bgColor: `${theme.colors.error}20`,
    };

  if (diffDays <= 3)
    return {
      status: 'Expiring Soon',
      color: theme.colors.warning,
      bgColor: `${theme.colors.warning}20`,
    };

  return {
    status: 'Fresh',
    color: theme.colors.success,
    bgColor: `${theme.colors.success}20`,
  };
};

// LocationFilter component to further break down UI logic
const LocationFilter = ({
  locations,
  selectedLocation,
  onSelect,
  theme,
}: {
  locations: string[];
  selectedLocation: string;
  onSelect: (location: string) => void;
  theme: any;
}) => {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={locations}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.locationFilterButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            selectedLocation === item && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => onSelect(item)}
        >
          <Text
            style={[
              {
                fontSize: 14,
                fontWeight: '600',
                color:
                  selectedLocation === item
                    ? '#FFFFFF'
                    : theme.colors.textSecondary,
              },
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

// Enhanced AIFoodScanner component to properly handle recognition
// This is a mock component that would be replaced with your actual AIFoodScanner component
// with these improvements integrated
const EnhancedAIFoodScanner = ({
  visible,
  onClose,
  onItemsAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onItemsAdded: () => Promise<void>;
}) => {
  const { theme } = useTheme();
  const [recognizedItems, setRecognizedItems] = React.useState<PantryItem[]>(
    []
  );
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanMode, setScanMode] = React.useState<'camera' | 'barcode'>(
    'camera'
  );

  // Simulated scanning function
  const scanFoodItems = async (imageUri: string) => {
    setIsScanning(true);

    // In a real implementation, this would send the image to an AI service
    // Mock recognition result
    setTimeout(() => {
      const mockResults: PantryItem[] = [
        {
          id: Date.now(),
          name: 'Apples',
          quantity: 5,
          unit: 'piece',
          location: 'Fridge',
          expiryDate: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(), // Example expiry
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: Date.now() + 1,
          name: 'Milk',
          quantity: 1,
          unit: 'carton',
          location: 'Fridge',
          expiryDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // Example expiry
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: Date.now() + 2,
          name: 'Bread',
          quantity: 1,
          unit: 'loaf',
          location: 'Pantry',
          expiryDate: new Date(
            Date.now() + 5 * 24 * 60 * 60 * 1000
          ).toISOString(), // Example expiry
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setRecognizedItems(mockResults);
      setIsScanning(false);
    }, 2000);
  };

  // Simulated barcode scanning
  const handleBarcodeScan = (data: { type: string; data: string }) => {
    // In a real implementation, this would look up the barcode in a product database
    Alert.alert(
      'Product Found',
      `Found: Organic Milk (1 gallon)\nExpiry: 7 days\nLocation: Fridge`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Pantry',
          onPress: async () => {
            const newItem: PantryItem = {
              id: Date.now(),
              name: 'Organic Milk',
              quantity: 1,
              unit: 'gallon',
              location: 'Fridge',
              expiryDate: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(), // Example expiry
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await PantryDatabase.addItem(newItem);
            onItemsAdded();
            onClose();
          },
        },
      ]
    );
  };

  // Function to save all recognized items
  const saveRecognizedItems = async () => {
    try {
      for (const item of recognizedItems) {
        await PantryDatabase.addItem(item);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Success',
        `Added ${recognizedItems.length} items to your pantry!`
      );
      setRecognizedItems([]);
      onItemsAdded();
      onClose();
    } catch (error) {
      console.error('Error saving items:', error);
      Alert.alert('Error', 'Failed to save items to your pantry.');
    }
  };

  // Return the mocked component - this would be replaced with your actual AIFoodScanner component
  // with these improvements integrated
  return (
    <AIFoodScanner
      visible={visible}
      onClose={onClose}
      onItemsAdded={onItemsAdded}
    />
  );
};

// Main component
export default function PantryScreen() {
  const { theme } = useTheme();
  const [items, setItems] = React.useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<PantryItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLocation, setSelectedLocation] = React.useState('All');
  const [isAddModalVisible, setIsAddModalVisible] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PantryItem | null>(null);
  const [isAIScannerVisible, setIsAIScannerVisible] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const { execute: executeAsync, isLoading } = useAsyncOperation();

  // Animations
  const fadeAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const headerHeight = useSharedValue(0);

  // Animation styles
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerHeight.value }],
  }));

  React.useEffect(() => {
    checkFirstLaunch();
    loadItems();

    // Enhanced animations
    fadeAnim.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    headerHeight.value = withSequence(
      withTiming(-50, { duration: 0 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.exp) })
    );

    // Pulsing animation for FAB
    const startPulseAnimation = () => {
      pulseAnim.value = withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withDelay(
          500,
          withTiming(1, { duration: 0 }, (finished) => {
            if (finished) {
              startPulseAnimation();
            }
          })
        )
      );
    };

    startPulseAnimation();
  }, []);

  React.useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedLocation]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('@pantrypal_has_launched');
      if (!hasLaunched) setShowOnboarding(true);
    } catch (error) {
      console.error('Error checking first launch:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('@pantrypal_has_launched', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  const loadItems = async () => {
    try {
      await executeAsync(async () => {
        // Handle platform differences for database access
        if (Platform.OS === 'web') {
          // For web, use mock data if needed
          const storedItems = await AsyncStorage.getItem('pantryItems');
          if (storedItems) {
            setItems(JSON.parse(storedItems));
          } else {
            // Mock data for web testing
            const mockItems: PantryItem[] = [];
            setItems(mockItems);
          }
        } else {
          // For native platforms, use the actual database
          const allItems = await PantryDatabase.getAllItems();
          setItems(allItems);
        }
      }, 'Loading pantry items');
    } catch (error) {
      console.error('Error loading pantry items:', error);
      setItems([]);
    }
  };

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, []);

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLocation !== 'All') {
      filtered = filtered.filter((item) => item.location === selectedLocation);
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditingItem(null);
    setIsAddModalVisible(true);
  };

  const handleAIScanner = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsAIScannerVisible(true);
  };

  const handleItemsAdded = async () => {
    await loadItems();
  };

  const handleEditItem = (item: PantryItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingItem(item);
    setIsAddModalVisible(true);
  };

  const handleDeleteItem = async (id: number) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          await executeAsync(async () => {
            await PantryDatabase.deleteItem(id);
            await loadItems();
          }, 'Deleting item');
        },
      },
    ]);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const statusCounts = {
    fresh: items.filter(
      (item) => getExpirationStatus(item.expiryDate, theme).status === 'Fresh'
    ).length,
    expiring: items.filter(
      (item) =>
        getExpirationStatus(item.expiryDate, theme).status === 'Expiring Soon'
    ).length,
    expired: items.filter(
      (item) => getExpirationStatus(item.expiryDate, theme).status === 'Expired'
    ).length,
  };

  const locations = ['All', 'Pantry', 'Fridge', 'Freezer'];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View style={[headerStyle]}>
        <LinearGradient
          colors={theme.gradients.primary as any}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Pantry Pal</Text>
              <Text style={styles.headerSubtitle}>Smart Food Inventory</Text>
            </View>
            {isAuthenticated && (
              <View style={styles.headerStats}>
                <Text style={styles.headerStatsText}>{items.length} items</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Status Overview */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCards}>
          <TouchableOpacity
            style={[
              styles.overviewCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setSelectedLocation('All')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.overviewNumber, { color: theme.colors.success }]}
            >
              {statusCounts.fresh}
            </Text>
            <Text
              style={[
                styles.overviewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Fresh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.overviewCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => {
              // Filter to show only expiring items
              setSelectedLocation('All');
              setFilteredItems(
                items.filter(
                  (item) =>
                    getExpirationStatus(item.expiryDate, theme).status ===
                    'Expiring Soon'
                )
              );
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.overviewNumber, { color: theme.colors.warning }]}
            >
              {statusCounts.expiring}
            </Text>
            <Text
              style={[
                styles.overviewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Expiring
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.overviewCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => {
              // Filter to show only expired items
              setSelectedLocation('All');
              setFilteredItems(
                items.filter(
                  (item) =>
                    getExpirationStatus(item.expiryDate, theme).status ===
                    'Expired'
                )
              );
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.overviewNumber, { color: theme.colors.error }]}
            >
              {statusCounts.expired}
            </Text>
            <Text
              style={[
                styles.overviewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Expired
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchText, { color: theme.colors.text }]}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              // Simple filter menu
              Alert.alert('Filter Options', 'Select a filter:', [
                { text: 'Show All', onPress: () => setSelectedLocation('All') },
                {
                  text: 'Expiring Soon',
                  onPress: () => {
                    setSelectedLocation('All');
                    setFilteredItems(
                      items.filter(
                        (item) =>
                          getExpirationStatus(item.expiryDate, theme).status ===
                          'Expiring Soon'
                      )
                    );
                  },
                },
                {
                  text: 'Expired',
                  onPress: () => {
                    setSelectedLocation('All');
                    setFilteredItems(
                      items.filter(
                        (item) =>
                          getExpirationStatus(item.expiryDate, theme).status ===
                          'Expired'
                      )
                    );
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <Feather
              name="filter"
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Filters */}
      <View style={styles.filterContainer}>
        <LocationFilter
          locations={locations}
          selectedLocation={selectedLocation}
          onSelect={setSelectedLocation}
          theme={theme}
        />
      </View>

      {/* Pantry Items List */}
      <Animated.View style={[styles.listContainer, fadeStyle]}>
        {filteredItems.length === 0 ? (
          isLoading ? (
            <LoadingSpinner message="Loading your pantry..." />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather
                name="package"
                size={64}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No Items Found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {items.length === 0
                  ? 'Start by adding your first pantry item or use the camera to scan food'
                  : 'Try adjusting your search or filter'}
              </Text>

              {items.length === 0 && (
                <TouchableOpacity
                  style={[
                    styles.scanSuggestionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleAIScanner}
                >
                  <Feather
                    name="camera"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Scan Food Items
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id!.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            renderItem={({ item }) => (
              <PantryItemCard
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                theme={theme}
              />
            )}
          />
        )}
      </Animated.View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer as any}>
        <Animated.View style={[styles.fabSecondary, pulseStyle]}>
          <TouchableOpacity onPress={handleAIScanner} activeOpacity={0.8}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.fabGradient}
            >
              <Feather name="camera" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.fab, pulseStyle]}>
          <TouchableOpacity onPress={handleAddItem} activeOpacity={0.8}>
            <LinearGradient
              colors={theme.gradients.primary as any}
              style={styles.fabGradient}
            >
              <Feather name="plus" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Modals */}
      <AddItemModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={handleItemsAdded}
        editingItem={editingItem}
      />

      <EnhancedAIFoodScanner
        visible={isAIScannerVisible}
        onClose={() => setIsAIScannerVisible(false)}
        onItemsAdded={handleItemsAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  headerStatsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  overviewContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
  },
  overviewCards: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    height: 50,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterButton: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  locationFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
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
    marginBottom: 20,
  },
  scanSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    gap: 16,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

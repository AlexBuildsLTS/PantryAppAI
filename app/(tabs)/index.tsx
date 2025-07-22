import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Animated,
  Vibration,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Calendar, MapPin, Package2, Camera, Brain, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AIFoodScanner } from '@/components/AIFoodScanner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PantryDatabase } from '@/database/PantryDatabase';
import { AddItemModal } from '@/components/AddItemModal';
import { PantryItem } from '@/types/PantryItem';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { validatePantryItem } from '@/utils/validation';
import { handleError } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PantryScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isAIScannerVisible, setIsAIScannerVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const { execute: executeAsync, isLoading } = useAsyncOperation();

  useEffect(() => {
    checkFirstLaunch();
    loadItems();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Start pulse animation for FAB
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedLocation]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('@pantrypal_has_launched');
      if (!hasLaunched) {
        setShowOnboarding(true);
      }
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
    await executeAsync(async () => {
      const allItems = await PantryDatabase.getAllItems();
      setItems(allItems);
    }, 'Loading pantry items');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };
  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLocation !== 'All') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsAddModalVisible(true);
  };

  const handleAIScanner = () => {
    setIsAIScannerVisible(true);
  };

  const handleItemsAdded = async () => {
    await loadItems();
  };

  const handleEditItem = (item: PantryItem) => {
    setEditingItem(item);
    setIsAddModalVisible(true);
  };

  const handleDeleteItem = async (id: number) => {
    // Add haptic feedback
    Vibration.vibrate(50);
    
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await executeAsync(async () => {
              await PantryDatabase.deleteItem(id);
              await loadItems();
            }, 'Deleting item');
          },
        },
      ]
    );
  };

  const getExpirationStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', color: '#EF4444', bgColor: '#FEE2E2' };
    if (diffDays <= 3) return { status: 'expiring', color: '#F59E0B', bgColor: '#FEF3C7' };
    return { status: 'fresh', color: '#22C55E', bgColor: '#DCFCE7' };
  };

  const getStatusCounts = () => {
    const fresh = items.filter(item => getExpirationStatus(item.expiryDate).status === 'fresh').length;
    const expiring = items.filter(item => getExpirationStatus(item.expiryDate).status === 'expiring').length;
    const expired = items.filter(item => getExpirationStatus(item.expiryDate).status === 'expired').length;
    return { fresh, expiring, expired };
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  const renderPantryItem = ({ item, index }: { item: PantryItem; index: number }) => {
    const expirationStatus = getExpirationStatus(item.expiryDate);
    const scaleAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={[
          styles.itemCard,
          { 
            backgroundColor: expirationStatus.bgColor,
            transform: [{ scale: scaleAnim }, { translateX: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleEditItem(item)}
          onLongPress={() => handleDeleteItem(item.id!)}
          style={styles.itemContent}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: expirationStatus.color }]}>
              <Text style={styles.statusText}>
                {expirationStatus.status === 'expired' ? 'Expired' : 
                 expirationStatus.status === 'expiring' ? 'Expiring Soon' : 'Fresh'}
              </Text>
            </View>
          </View>
          
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Package2 size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.quantity} {item.unit}</Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Expires: {new Date(item.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const locations = ['All', 'Pantry', 'Fridge', 'Freezer'];
  const statusCounts = getStatusCounts();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary as any}
        start={[0, 0]}
        end={[1, 1]}
        locations={[0, 0.8]}
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

      {/* Quick Overview Cards */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCards}>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.overviewNumber, { color: theme.colors.success }]}>{statusCounts.fresh}</Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>Fresh Items</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.overviewNumber, { color: theme.colors.warning }]}>{statusCounts.expiring}</Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>Expiring Soon</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.overviewNumber, { color: theme.colors.error }]}>{statusCounts.expired}</Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>Expired</Text>
          </View>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchText, { color: theme.colors.text }]}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={locations}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border 
                },
                selectedLocation === item && { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary 
                }
              ]}
              onPress={() => setSelectedLocation(item)}
            >
              <Text style={[
                { 
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedLocation === item ? '#FFFFFF' : theme.colors.textSecondary 
                }
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {filteredItems.length === 0 ? (
          isLoading ? (
            <LoadingSpinner message="Loading your pantry items..." />
          ) : (
            <View style={styles.emptyContainer}>
              <Package2 size={64} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No items found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
                {items.length === 0 
                  ? "Start by adding your first pantry item"
                  : "Try adjusting your search or filter"}
              </Text>
            </View>
          )
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={({ item, index }) => {
              const expirationStatus = getExpirationStatus(item.expiryDate);
              const scaleAnim = new Animated.Value(0);
              const slideAnim = new Animated.Value(50);

              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                delay: index * 100,
                useNativeDriver: true,
              }).start();
              
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                delay: index * 100,
                useNativeDriver: true,
              }).start();

              return (
                <Animated.View
                  style={[
                    styles.itemCard,
                    { 
                      backgroundColor: expirationStatus.bgColor,
                      transform: [{ scale: scaleAnim }, { translateX: slideAnim }],
                      opacity: fadeAnim,
                    }
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleEditItem(item)}
                    onLongPress={() => handleDeleteItem(item.id!)}
                    style={styles.itemContent}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: expirationStatus.color }]}>
                        <Text style={styles.statusText}>
                          {expirationStatus.status === 'expired' ? 'Expired' : 
                           expirationStatus.status === 'expiring' ? 'Expiring Soon' : 'Fresh'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}>
                        <Package2 size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.quantity} {item.unit}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MapPin size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.location}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Calendar size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
            keyExtractor={(item) => item.id!.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </Animated.View>

      <View style={styles.fabContainer}>
        <Animated.View style={[styles.fabSecondary, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity onPress={handleAIScanner}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.fabGradient}
            >
              <Brain size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[styles.fab, styles.fabPrimary, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity onPress={handleAddItem}>
            <LinearGradient
              colors={theme.gradients.primary as any}
              style={styles.fabGradient}
            >
              <Plus size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <AddItemModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={loadItems}
        editingItem={editingItem}
      />
      
      <AIFoodScanner
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
    paddingVertical: 24,
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
    marginBottom: 4,
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
    paddingTop: 16,
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
    elevation: 2,
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
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    gap: 16,
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
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Primary FAB styles (already defined above)
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
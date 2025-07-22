import * as React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, StatusBar, Animated, Vibration, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [pulseAnim] = React.useState(new Animated.Value(1));
  const { isAuthenticated } = useAuth();
  const { execute: executeAsync, isLoading } = useAsyncOperation();

  React.useEffect(() => {
    checkFirstLaunch();
    loadItems();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []); // Empty dependency array means this runs once on mount

  React.useEffect(() => { filterItems(); }, [items, searchQuery, selectedLocation]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('@pantrypal_has_launched');
      if (!hasLaunched) setShowOnboarding(true);
    } catch (error) { console.error('Error checking first launch:', error); }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('@pantrypal_has_launched', 'true');
      setShowOnboarding(false);
    } catch (error) { console.error('Error saving onboarding completion:', error); }
  };

  const loadItems = async () => {
    await executeAsync(async () => {
      const allItems = await PantryDatabase.getAllItems();
      setItems(allItems);
    }, 'Loading pantry items');
  };

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, []); // Empty dependency array means this function is memoized once

  const filterItems = () => {
    let filtered = items;
    if (searchQuery) filtered = filtered.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedLocation !== 'All') filtered = filtered.filter(item => item.location === selectedLocation);
    setFilteredItems(filtered);
  };

  const handleAddItem = () => { setEditingItem(null); setIsAddModalVisible(true); };
  const handleAIScanner = () => setIsAIScannerVisible(true);
  const handleItemsAdded = async () => { await loadItems(); };
  const handleEditItem = (item: PantryItem) => { setEditingItem(item); setIsAddModalVisible(true); };

  const handleDeleteItem = async (id: number) => {
    Vibration.vibrate(50);
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await executeAsync(async () => { await PantryDatabase.deleteItem(id); await loadItems(); }, 'Deleting item') },
    ]);
  };

  const getExpirationStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'Expired', color: theme.colors.error, bgColor: `${theme.colors.error}20` };
    if (diffDays <= 3) return { status: 'Expiring Soon', color: theme.colors.warning, bgColor: `${theme.colors.warning}20` };
    return { status: 'Fresh', color: theme.colors.success, bgColor: `${theme.colors.success}20` };
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const statusCounts = {
    fresh: items.filter(item => getExpirationStatus(item.expiryDate).status === 'Fresh').length,
    expiring: items.filter(item => getExpirationStatus(item.expiryDate).status === 'Expiring Soon').length,
    expired: items.filter(item => getExpirationStatus(item.expiryDate).status === 'Expired').length,
  };

  const locations = ['All', 'Pantry', 'Fridge', 'Freezer'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={theme.gradients.primary as any} style={styles.header}>
        <View style={styles.headerContent}>
          <View><Text style={styles.headerTitle}>Pantry Pal</Text><Text style={styles.headerSubtitle}>Smart Food Inventory</Text></View>
          {isAuthenticated && (<View style={styles.headerStats}><Text style={styles.headerStatsText}>{items.length} items</Text></View>)}
        </View>
      </LinearGradient>

      <View style={styles.overviewContainer}><View style={styles.overviewCards}>
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}><Text style={[styles.overviewNumber, { color: theme.colors.success }]}>{statusCounts.fresh}</Text><Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>Fresh</Text></View>
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}><Text style={[styles.overviewNumber, { color: theme.colors.warning }]}>{statusCounts.expiring}</Text><Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>Expiring</Text></View>
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}><Text style={[styles.overviewNumber, { color: theme.colors.error }]}>{statusCounts.expired}</Text><Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>Expired</Text></View>
      </View></View>
      
      <View style={styles.searchContainer}><View style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}>
        <Feather name="search" size={20} color="#9CA3AF" />
        <TextInput placeholder="Search items..." value={searchQuery} onChangeText={setSearchQuery} style={[styles.searchText, { color: theme.colors.text }]} placeholderTextColor="#9CA3AF" />
        <TouchableOpacity style={styles.filterButton}><Feather name="filter" size={20} color={theme.colors.textTertiary} /></TouchableOpacity>
      </View></View>

      <View style={styles.filterContainer}>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={locations} keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={[ styles.locationFilterButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, selectedLocation === item && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => setSelectedLocation(item)}>
              <Text style={[{ fontSize: 14, fontWeight: '600', color: selectedLocation === item ? '#FFFFFF' : theme.colors.textSecondary }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {filteredItems.length === 0 ? (
          isLoading ? <LoadingSpinner message="Loading your pantry..." /> : (
            <View style={styles.emptyContainer}>
              <Feather name="package" size={64} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No Items Found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>{items.length === 0 ? "Start by adding your first pantry item" : "Try adjusting your search or filter"}</Text>
            </View>
          )
        ) : (
          <FlatList data={filteredItems} keyExtractor={(item) => item.id!.toString()} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            renderItem={({ item, index }) => {
              const expirationStatus = getExpirationStatus(item.expiryDate);
              return (
                <Animated.View style={[styles.itemCard, { backgroundColor: expirationStatus.bgColor, transform: [{translateX: 0}] }]}>
                  <TouchableOpacity onPress={() => handleEditItem(item)} onLongPress={() => handleDeleteItem(item.id!)} style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: expirationStatus.color }]}><Text style={styles.statusText}>{expirationStatus.status}</Text></View>
                    </View>
                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}><Feather name="package" size={16} color={theme.colors.textSecondary} /><Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.quantity} {item.unit}</Text></View>
                      <View style={styles.detailRow}><Feather name="map-pin" size={16} color={theme.colors.textSecondary} /><Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.location}</Text></View>
                      <View style={styles.detailRow}><Feather name="calendar" size={16} color={theme.colors.textSecondary} /><Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text></View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        )}
      </Animated.View>

      <View style={styles.fabContainer}>
        <Animated.View style={[styles.fabSecondary, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity onPress={handleAIScanner}><LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.fabGradient}><Feather name="camera" size={24} color="#FFFFFF" /></LinearGradient></TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.fab, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity onPress={handleAddItem}><LinearGradient colors={theme.gradients.primary as any} style={styles.fabGradient}><Feather name="plus" size={24} color="#FFFFFF" /></LinearGradient></TouchableOpacity>
        </Animated.View>
      </View>

      <AddItemModal visible={isAddModalVisible} onClose={() => setIsAddModalVisible(false)} onSave={handleItemsAdded} editingItem={editingItem} />
      <AIFoodScanner visible={isAIScannerVisible} onClose={() => setIsAIScannerVisible(false)} onItemsAdded={handleItemsAdded} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' },
  headerStats: { alignItems: 'flex-end' },
  headerStatsText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' },
  overviewContainer: { paddingHorizontal: 20, marginTop: -16 },
  overviewCards: { flexDirection: 'row', gap: 12 },
  overviewCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  overviewNumber: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  overviewLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 16 },
  searchInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, height: 50 },
  searchText: { flex: 1, marginLeft: 12, fontSize: 16 },
  filterButton: { padding: 4 },
  filterContainer: { paddingHorizontal: 20, marginBottom: 16 },
  locationFilterButton: { paddingHorizontal: 20, paddingVertical: 8, marginRight: 12, borderRadius: 20, borderWidth: 1 },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  itemCard: { borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, },
  itemContent: { padding: 16 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 18, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' },
  itemDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  fabContainer: { position: 'absolute', bottom: 32, right: 20, gap: 16, alignItems: 'center' },
  fab: { width: 56, height: 56, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabSecondary: { width: 48, height: 48, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});
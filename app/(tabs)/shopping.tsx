import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ShoppingCart, Trash2, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  createdAt: string;
}

export default function ShoppingScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    loadShoppingList();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadShoppingList = async () => {
    try {
      const stored = await AsyncStorage.getItem('shoppingList');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  const saveShoppingList = async (updatedItems: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [newItem, ...items];
    setItems(updatedItems);
    saveShoppingList(updatedItems);
    setNewItemName('');
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updatedItems);
    saveShoppingList(updatedItems);
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter(item => item.id !== id);
            setItems(updatedItems);
            saveShoppingList(updatedItems);
          },
        },
      ]
    );
  };

  const clearCompleted = () => {
    const completedItems = items.filter(item => item.completed);
    if (completedItems.length === 0) return;

    Alert.alert(
      'Clear Completed',
      `Remove ${completedItems.length} completed item${completedItems.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter(item => !item.completed);
            setItems(updatedItems);
            saveShoppingList(updatedItems);
          },
        },
      ]
    );
  };

  const renderShoppingItem = ({ item, index }: { item: ShoppingItem; index: number }) => {
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
          styles.itemCard,
          item.completed && styles.itemCardCompleted,
          { transform: [{ scale: scaleAnim }], opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => toggleItem(item.id)}
        >
          <View style={[
            styles.checkbox,
            item.completed && styles.checkboxCompleted
          ]}>
            {item.completed && <Check size={16} color="#FFFFFF" />}
          </View>
          <Text style={[
            styles.itemName,
            item.completed && styles.itemNameCompleted
          ]}>
            {item.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const completedCount = items.filter(item => item.completed).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ShoppingCart size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {items.length} items • {completedCount} completed
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.addItemContainer}>
        <View style={[styles.addItemInput, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Add new item..."
            placeholderTextColor={theme.colors.textTertiary}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={addItem}
            disabled={!newItemName.trim()}
          >
            <Plus size={20} color={newItemName.trim() ? theme.colors.secondary : theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>Your shopping list is empty</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              Add items to keep track of what you need to buy
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={renderShoppingItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
            
            {completedCount > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
                <Text style={[styles.clearButtonText, { color: theme.colors.error }]}>
                  Clear {completedCount} completed item{completedCount > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </>
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
  addItemContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addItemInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemCardCompleted: {
    backgroundColor: '#F3F4F6',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  itemName: {
    fontSize: 16,
    flex: 1,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
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
  clearButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  SafeAreaView, // Removed duplicate Animated import
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native'; // Removed duplicate Animated import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

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
  const [isLoading, setIsLoading] = useState(true);
  const [buttonScale] = useState(new Animated.Value(1));

  useEffect(() => {
    loadShoppingList();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadShoppingList = async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem('shoppingList');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
      Alert.alert('Error', 'Failed to load your shopping list.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveShoppingList = async (updatedItems: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error saving shopping list:', error);
      Alert.alert('Error', 'Failed to save your shopping list.');
    }
  };

  const handleAddButtonPress = () => {
    // Animate the button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Call the add item function
    addItem();
  };

  const addItem = () => {
    console.log('Adding item:', newItemName);
    if (!newItemName.trim()) {
      console.log('Item name is empty, not adding');
      return;
    }

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
    Keyboard.dismiss();
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updatedItems);
    saveShoppingList(updatedItems);
  };

  const deleteItem = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedItems = items.filter((item) => item.id !== id);
          setItems(updatedItems);
          saveShoppingList(updatedItems);
        },
      },
    ]);
  };

  const clearCompleted = () => {
    const completedItems = items.filter((item) => item.completed);
    if (completedItems.length === 0) return;

    Alert.alert(
      'Clear Completed',
      `Remove ${completedItems.length} completed item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter((item) => !item.completed);
            setItems(updatedItems);
            saveShoppingList(updatedItems);
          },
        },
      ]
    );
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => (
    <Animated.View
      style={[
        styles.itemCard,
        item.completed && styles.itemCardCompleted,
        { backgroundColor: theme.colors.surface },
      ]} // @ts-ignore
      entering={Animated.FadeInDown.duration(300)} // @ts-ignore
      exiting={Animated.FadeOutUp.duration(200)} // @ts-ignore
    >
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => toggleItem(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: theme.colors.border },
            item.completed && styles.checkboxCompleted,
          ]}
        >
          {item.completed && <Feather name="check" size={16} color="#FFFFFF" />}
        </View>
        <Text
          style={[
            styles.itemName,
            { color: theme.colors.text },
            item.completed && styles.itemNameCompleted,
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="trash-2" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </Animated.View>
  );

  const completedCount = items.filter((item) => item.completed).length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={theme.gradients.secondary as any}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Feather name="shopping-cart" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {items.length} items • {completedCount} completed
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.addItemContainer}>
        <View
          style={[
            styles.addItemInput,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Add new item..."
            placeholderTextColor={theme.colors.textTertiary}
            onSubmitEditing={addItem}
            returnKeyType="done"
            autoCapitalize="sentences"
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: newItemName.trim()
                    ? theme.colors.secondary
                    : theme.colors.surface,
                },
              ]}
              onPress={handleAddButtonPress}
              disabled={!newItemName.trim()}
              activeOpacity={0.7}
            >
              <Feather
                name="plus"
                size={20}
                color={
                  newItemName.trim() ? '#FFFFFF' : theme.colors.textTertiary
                }
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text
            style={[styles.loaderText, { color: theme.colors.textSecondary }]}
          >
            Loading your shopping list...
          </Text>
        </View>
      ) : (
        <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="shopping-cart"
                size={64}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Your shopping list is empty
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.colors.textTertiary },
                ]}
              >
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
                initialNumToRender={10}
                maxToRenderPerBatch={10}
              />

              {completedCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.clearButton,
                    { backgroundColor: theme.colors.borderLight },
                  ]}
                  onPress={clearCompleted}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.clearButtonText,
                      { color: theme.colors.error },
                    ]}
                  >
                    Clear {completedCount} completed item(s)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      )}

      {/* Floating Add Button for quick access */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: theme.colors.secondary },
        ]}
        onPress={() => {
          // Focus the text input
          Animated.sequence([
            Animated.timing(buttonScale, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    height: 48,
  },
  addButton: {
    padding: 8,
    borderRadius: 12,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    opacity: 0.6,
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
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

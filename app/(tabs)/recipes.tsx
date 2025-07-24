import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipeCard } from '@/components/RecipeCard';
import { PantryDatabase } from '@/database/PantryDatabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Recipe } from '@/types';

export default function RecipesScreen() {
  const { theme } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadRecipes();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery]); // Fix: Added missing semicolon

  const loadRecipes = async () => {
    try {
      const pantryItems = await PantryDatabase.getAllItems();
      const userIngredients = pantryItems.map((item) =>
        item.name.toLowerCase()
      ); // This is correct, userIngredients is an array of strings
      const mockRecipes: Recipe[] = [
        {
          id: '1',
          title: 'Creamy Mushroom Pasta',
          image:
            'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
          cookTime: 25,
          servings: 4,
          difficulty: 'Easy',
          rating: 4.8,
          ingredients: [
            { name: 'pasta', amount: 200, unit: 'g' },
            { name: 'mushrooms', amount: 200, unit: 'g' },
            { name: 'cream', amount: 200, unit: 'ml' },
          ],
          instructions: [],
          prepTime: 10,
          description: '',
          nutrition: undefined,
          tags: [],
          availableIngredients: 0,
        },
        {
          id: '2',
          title: 'Mediterranean Chicken Bowl',
          image:
            'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
          cookTime: 30,
          servings: 2,
          difficulty: 'Medium',
          rating: 4.6,
          ingredients: [
            { name: 'chicken', amount: 300, unit: 'g' },
            { name: 'quinoa', amount: 1, unit: 'cup' },
            { name: 'cucumber', amount: 1, unit: 'pcs' },
            { name: 'tomato', amount: 2, unit: 'pcs' },
          ],
          instructions: [],
          prepTime: 15,
          description: '',
          nutrition: undefined,
          tags: [],
          availableIngredients: 0,
        },
        {
          id: '3',
          title: 'Vegetable Stir-Fry',
          image:
            'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
          cookTime: 20,
          servings: 3,
          difficulty: 'Easy',
          rating: 4.5,
          ingredients: [
            { name: 'broccoli', amount: 1, unit: 'head' },
            { name: 'carrots', amount: 2, unit: 'pcs' },
            { name: 'bell pepper', amount: 1, unit: 'pcs' },
            { name: 'soy sauce', amount: 2, unit: 'tbsp' },
          ],
          instructions: [],
          prepTime: 10,
          description: '',
          nutrition: undefined,
          tags: [],
          availableIngredients: 0,
        },
        {
          id: '4',
          title: 'Beef Tacos',
          image:
            'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
          cookTime: 15,
          servings: 4,
          difficulty: 'Easy',
          rating: 4.7,
          ingredients: [
            { name: 'ground beef', amount: 500, unit: 'g' },
            { name: 'taco shells', amount: 12, unit: 'pcs' },
            { name: 'lettuce', amount: 1, unit: 'head' },
            { name: 'cheese', amount: 100, unit: 'g' },
          ],
          instructions: [],
          prepTime: 5,
          description: '',
          nutrition: undefined,
          tags: [],
          availableIngredients: 0,
        },
        {
          id: '5',
          title: 'Caprese Salad',
          image:
            'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
          cookTime: 10,
          servings: 2,
          difficulty: 'Easy',
          rating: 4.9,
          ingredients: [
            { name: 'mozzarella', amount: 150, unit: 'g' },
            { name: 'tomato', amount: 2, unit: 'pcs' },
            { name: 'basil', amount: 1, unit: 'bunch' },
          ],
          instructions: [],
          prepTime: 5,
          description: '',
          nutrition: undefined,
          tags: [],
          availableIngredients: 0,
        },
      ];
      const recipesWithMatches = mockRecipes.map((recipe) => ({
        ...recipe,
        availableIngredients: recipe.ingredients.filter((ing) =>
          userIngredients.some((userIng) =>
            userIng.includes(ing.name.toLowerCase())
          )
        ).length,
      }));
      recipesWithMatches.sort((a, b) => {
        const aMatchRatio =
          a.ingredients.length > 0
            ? a.availableIngredients / a.ingredients.length
            : 0;
        const bMatchRatio =
          b.ingredients.length > 0
            ? b.availableIngredients / b.ingredients.length
            : 0;
        return bMatchRatio - aMatchRatio;
      });
      setRecipes(recipesWithMatches);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;
    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredRecipes(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };
  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item as any}
      onPress={() => console.log(`Selected recipe: ${item.title}`)} // Placeholder for navigation or action
    />
  );
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={theme.gradients.accent as any}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="chef-hat" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Recipe Suggestions</Text>
          <Text style={styles.headerSubtitle}>
            Based on your pantry ingredients
          </Text>
        </View>
      </LinearGradient>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Feather name="search" size={20} color={theme.colors.textTertiary} />
          <TextInput
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchText, { color: theme.colors.text }]}
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      </View>
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="pot-steam-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text
              style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}
            >
              No Recipes Found
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.colors.textTertiary },
              ]}
            >
              Add more items to get suggestions
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={320}
            decelerationRate="fast"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={theme.gradients.accent as any}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="chef-hat" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Recipe Suggestions</Text>
          <Text style={styles.headerSubtitle}>
            Based on your pantry ingredients
          </Text>
        </View>
      </LinearGradient>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Feather name="search" size={20} color={theme.colors.textTertiary} />
          <TextInput
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchText, { color: theme.colors.text }]}
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      </View>
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="pot-steam-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text
              style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}
            >
              No Recipes Found
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.colors.textTertiary },
              ]}
            >
              Add more items to get suggestions
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={320}
            decelerationRate="fast"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        )}
      </Animated.View>
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
  searchContainer: { paddingHorizontal: 20, paddingVertical: 16 },
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
  searchText: { flex: 1, marginLeft: 12, fontSize: 16 },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingVertical: 20 },
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
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});

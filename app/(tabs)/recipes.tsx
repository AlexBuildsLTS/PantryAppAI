import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChefHat, Search, Filter, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipeCard } from '@/components/RecipeCard';
import { PantryDatabase } from '@/database/PantryDatabase';
import { useTheme } from '@/contexts/ThemeContext';

interface Recipe {
  id: string;
  title: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  ingredients: string[];
  availableIngredients: number;
}

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
  }, [recipes, searchQuery]);

  const loadRecipes = async () => {
    try {
      // Get user's pantry items
      const pantryItems = await PantryDatabase.getAllItems();
      const userIngredients = pantryItems.map(item => item.name.toLowerCase());

      // Mock recipe data - in a real app, this would come from an API
      const mockRecipes: Recipe[] = [
        {
          id: '1',
          title: 'Creamy Mushroom Pasta',
          image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
          cookTime: 25,
          servings: 4,
          difficulty: 'Easy',
          rating: 4.8,
          ingredients: ['pasta', 'mushrooms', 'cream', 'garlic', 'parmesan'],
          availableIngredients: 0,
        },
        {
          id: '2',
          title: 'Mediterranean Chicken Bowl',
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
          cookTime: 30,
          servings: 2,
          difficulty: 'Medium',
          rating: 4.6,
          ingredients: ['chicken', 'rice', 'tomatoes', 'olives', 'feta cheese'],
          availableIngredients: 0,
        },
        {
          id: '3',
          title: 'Vegetable Stir Fry',
          image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
          cookTime: 15,
          servings: 3,
          difficulty: 'Easy',
          rating: 4.4,
          ingredients: ['broccoli', 'carrots', 'bell peppers', 'soy sauce', 'ginger'],
          availableIngredients: 0,
        },
        {
          id: '4',
          title: 'Beef Tacos',
          image: 'https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg',
          cookTime: 20,
          servings: 4,
          difficulty: 'Easy',
          rating: 4.7,
          ingredients: ['ground beef', 'tortillas', 'lettuce', 'tomatoes', 'cheese'],
          availableIngredients: 0,
        },
        {
          id: '5',
          title: 'Salmon with Quinoa',
          image: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg',
          cookTime: 35,
          servings: 2,
          difficulty: 'Medium',
          rating: 4.9,
          ingredients: ['salmon', 'quinoa', 'asparagus', 'lemon', 'olive oil'],
          availableIngredients: 0,
        },
      ];

      // Calculate available ingredients for each recipe
      const recipesWithMatches = mockRecipes.map(recipe => ({
        ...recipe,
        availableIngredients: recipe.ingredients.filter(ingredient =>
          userIngredients.some(userIngredient =>
            userIngredient.includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(userIngredient)
          )
        ).length,
      }));

      // Sort by ingredient match percentage
      recipesWithMatches.sort((a, b) => {
        const aMatch = a.availableIngredients / a.ingredients.length;
        const bMatch = b.availableIngredients / b.ingredients.length;
        return bMatch - aMatch;
      });

      setRecipes(recipesWithMatches);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        )
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
      recipe={item}
      onPress={() => {
        // Handle recipe selection - could navigate to recipe details
        console.log('Selected recipe:', item.title);
      }}
    />
  );

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
          <ChefHat size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Recipe Suggestions</Text>
          <Text style={styles.headerSubtitle}>
            Based on your pantry ingredients
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}>
          <Search size={20} color={theme.colors.textTertiary} />
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
            <Sparkles size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No recipes found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              Add more items to your pantry to get personalized recipe suggestions
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
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </Animated.View>

      <View style={styles.tipContainer}>
        <LinearGradient
          colors={['#FF6B6B', '#FFD93D']}
          start={[0, 0]}
          style={styles.tipCard}
        >
          <Sparkles size={24} color="#FFFFFF" />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: '#FFFFFF' }]}>Pro Tip</Text>
            <Text style={[styles.tipText, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              Recipes are sorted by how many ingredients you already have. The higher the match percentage, the easier it is to cook!
            </Text>
          </View>
        </LinearGradient>
      </View>
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 20,
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
  tipContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
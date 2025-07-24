import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, RefreshControl, SafeAreaView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipeCard } from '@/components/RecipeCard';
import { PantryDatabase } from '@/database/PantryDatabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Recipe } from '@/types/Recipe';

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
      const pantryItems = await PantryDatabase.getAllItems();
      const userIngredients = pantryItems.map(item => item.name.toLowerCase());

      const mockRecipes: Omit<Recipe, 'availableIngredients' | 'matchPercentage'>[] = [
          { id: '1', title: 'Creamy Mushroom Pasta', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg', cookTime: 25, servings: 4, difficulty: 'Easy', rating: 4.8, ingredients: [{name: 'pasta'}, {name: 'mushrooms'}] as any, instructions: [], prepTime: 10, description: '', nutrition: undefined, tags: [] },
          { id: '2', title: 'Mediterranean Chicken Bowl', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', cookTime: 30, servings: 2, difficulty: 'Medium', rating: 4.6, ingredients: [{name: 'chicken'}, {name: 'rice'}] as any, instructions: [], prepTime: 15, description: '', nutrition: undefined, tags: [] },
      ];
      
      const recipesWithMatches = mockRecipes.map(recipe => ({
        ...recipe,
        availableIngredients: recipe.ingredients.filter(ing => userIngredients.some(userIng => userIng.includes(ing.name) || ing.name.includes(userIng))).length,
        matchPercentage: 0
      }));

      recipesWithMatches.sort((a, b) => (b.availableIngredients / b.ingredients.length) - (a.availableIngredients / a.ingredients.length));
      setRecipes(recipesWithMatches);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
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
      recipe={item}
      onPress={() => {
        console.log('Selected recipe:', item.title);
      }}
    />
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        <View style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}>
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
            <MaterialCommunityIcons name="pot-steam-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No Recipes Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
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
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts', 
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather name="bell" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  ingredients: Ingredient[];
  instructions: string[];
  createdAt: string;
  createdBy: string;
  status: 'approved' | 'pending' | 'rejected';
  matchPercentage?: number;
}

interface PantryItem {
  id: string;
  name: string;
  category: string;
  location: 'pantry' | 'fridge' | 'freezer';
  expiryDate: string | null;
  quantity: number;
  unit: string;
}

export default function RecipesScreen() {
  const { theme } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addRecipeModalVisible, setAddRecipeModalVisible] = useState(false);
  const [myRecipesVisible, setMyRecipesVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));
  
  // New recipe form state
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    cookTime: 30,
    servings: 4,
    difficulty: 'Medium',
    ingredients: [],
    instructions: [],
    status: 'pending'
  });
  const [newIngredient, setNewIngredient] = useState({ name: '', amount: '', unit: '' });
  const [newInstruction, setNewInstruction] = useState('');

  useEffect(() => {
    loadRecipes();
    loadPantryItems();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      filterRecipes();
    }
  }, [searchQuery, recipes, pantryItems, myRecipesVisible]);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      // Try to load from storage first
      const storedRecipes = await AsyncStorage.getItem('recipes');
      
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      } else {
        // If no stored recipes, load sample data
        const sampleRecipes: Recipe[] = [
          {
            id: '1',
            title: 'Creamy Mushroom Pasta',
            imageUrl: 'https://images.unsplash.com/photo-1576007736402-63a0019a4103',
            cookTime: 25,
            servings: 4,
            difficulty: 'Easy',
            rating: 4.8,
            ingredients: [
              { id: '1', name: 'Pasta', amount: '250', unit: 'g' },
              { id: '2', name: 'Mushrooms', amount: '300', unit: 'g' },
              { id: '3', name: 'Heavy Cream', amount: '200', unit: 'ml' }
            ],
            instructions: [
              'Cook pasta according to package instructions.',
              'Sauté mushrooms until golden brown.',
              'Add cream and simmer for 5 minutes.',
              'Mix with pasta and serve immediately.'
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system',
            status: 'approved'
          },
          {
            id: '2',
            title: 'Mediterranean Salad',
            imageUrl: 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0',
            cookTime: 15,
            servings: 2,
            difficulty: 'Easy',
            rating: 4.5,
            ingredients: [
              { id: '1', name: 'Cucumber', amount: '1', unit: 'medium' },
              { id: '2', name: 'Tomato', amount: '2', unit: 'medium' },
              { id: '3', name: 'Feta Cheese', amount: '100', unit: 'g' },
              { id: '4', name: 'Olives', amount: '50', unit: 'g' },
              { id: '5', name: 'Olive Oil', amount: '2', unit: 'tbsp' }
            ],
            instructions: [
              'Dice cucumber and tomatoes.',
              'Crumble feta cheese.',
              'Mix all ingredients in a bowl.',
              'Drizzle with olive oil and season to taste.'
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system',
            status: 'approved'
          },
          {
            id: '3',
            title: 'Homemade Pizza',
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
            cookTime: 45,
            servings: 4,
            difficulty: 'Medium',
            rating: 4.9,
            ingredients: [
              { id: '1', name: 'Flour', amount: '300', unit: 'g' },
              { id: '2', name: 'Yeast', amount: '7', unit: 'g' },
              { id: '3', name: 'Tomato Sauce', amount: '150', unit: 'ml' },
              { id: '4', name: 'Cheese', amount: '200', unit: 'g' }
            ],
            instructions: [
              'Mix flour, yeast, salt, and water to make dough.',
              'Let it rise for 30 minutes.',
              'Roll out the dough and add toppings.',
              'Bake at 220°C for 15 minutes.'
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system',
            status: 'approved'
          }
        ];
        
        setRecipes(sampleRecipes);
        await AsyncStorage.setItem('recipes', JSON.stringify(sampleRecipes));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPantryItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem('pantryItems');
      if (storedItems) {
        setPantryItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Error loading pantry items:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(recipe => 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ing => 
          ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Show only approved recipes in the main view, unless viewing "My Recipes"
    if (!myRecipesVisible) {
      filtered = filtered.filter(recipe => recipe.status === 'approved');
    } else {
      filtered = filtered.filter(recipe => recipe.createdBy === 'user');
    }
    
    // Calculate match percentage based on pantry items
    filtered = filtered.map(recipe => {
      const totalIngredients = recipe.ingredients.length;
      if (totalIngredients === 0) return { ...recipe, matchPercentage: 0 };
      
      const matchedIngredients = recipe.ingredients.filter(ingredient => 
        pantryItems.some(item => 
          item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
          ingredient.name.toLowerCase().includes(item.name.toLowerCase())
        )
      ).length;
      
      const percentage = Math.round((matchedIngredients / totalIngredients) * 100);
      return { ...recipe, matchPercentage: percentage };
    });
    
    // Sort by match percentage (highest first)
    filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    
    setFilteredRecipes(filtered);
  };

  const handleAddButtonPress = () => {
    // Animate the button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    // Open add recipe modal
    setAddRecipeModalVisible(true);
  };

  const addNewRecipe = async () => {
    if (!newRecipe.title || !newRecipe.title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title.');
      return;
    }
    
    if (!newRecipe.ingredients || newRecipe.ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient.');
      return;
    }
    
    if (!newRecipe.instructions || newRecipe.instructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction step.');
      return;
    }
    
    const recipeToAdd: Recipe = {
      id: Date.now().toString(),
      title: newRecipe.title,
      imageUrl: newRecipe.imageUrl || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65',
      cookTime: newRecipe.cookTime || 30,
      servings: newRecipe.servings || 4,
      difficulty: newRecipe.difficulty || 'Medium',
      rating: 0,
      ingredients: newRecipe.ingredients || [],
      instructions: newRecipe.instructions || [],
      createdAt: new Date().toISOString(),
      createdBy: 'user', // In a real app, this would be the user's ID
      status: 'pending'
    };
    
    try {
      const updatedRecipes = [...recipes, recipeToAdd];
      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
      
      // Reset form
      setNewRecipe({
        title: '',
        cookTime: 30,
        servings: 4,
        difficulty: 'Medium',
        ingredients: [],
        instructions: [],
        status: 'pending'
      });
      setAddRecipeModalVisible(false);
      
      Alert.alert(
        'Recipe Submitted',
        'Your recipe has been submitted for review. It will be visible once approved.'
      );
    } catch (error) {
      console.error('Error saving new recipe:', error);
      Alert.alert('Error', 'Failed to save your recipe. Please try again.');
    }
  };

  const addIngredientToRecipe = () => {
    if (!newIngredient.name.trim()) return;
    
    const ingredient: Ingredient = {
      id: Date.now().toString(),
      name: newIngredient.name.trim(),
      amount: newIngredient.amount.trim(),
      unit: newIngredient.unit.trim()
    };
    
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), ingredient]
    }));
    
    setNewIngredient({ name: '', amount: '', unit: '' });
  };

  const addInstructionToRecipe = () => {
    if (!newInstruction.trim()) return;
    
    setNewRecipe(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), newInstruction.trim()]
    }));
    
    setNewInstruction('');
  };

  const removeIngredient = (id: string) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter(ing => ing.id !== id) || []
    }));
  };

  const removeInstruction = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleMyRecipes = () => {
    setMyRecipesVisible(!myRecipesVisible);
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => {
    const isPending = item.status === 'pending';
    
    return (
      <TouchableOpacity
        style={[
          styles.recipeCard,
          { backgroundColor: theme.colors.surface }
        ]}
        onPress={() => {
          setSelectedRecipe(item);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
        
        {isPending && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>PENDING</Text>
          </View>
        )}
        
        <View style={styles.matchContainer}>
          <Text style={styles.matchText}>{item.matchPercentage || 0}% Match</Text>
        </View>
        
        <View style={styles.recipeInfo}>
          <Text style={[styles.recipeTitle, { color: theme.colors.text }]}>{item.title}</Text>
          
          <View style={styles.recipeMetadata}>
            <View style={styles.metadataItem}>
              <Feather name="clock" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>{item.cookTime}m</Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Feather name="users" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>{item.servings}</Text>
            </View>
            
            <View style={styles.metadataItem}>
              <MaterialCommunityIcons 
                name="chef-hat" 
                size={14} 
                color={
                  item.difficulty === 'Easy' ? '#22C55E' :
                  item.difficulty === 'Medium' ? '#F59E0B' : '#EF4444'
                } 
              />
              <Text 
                style={[
                  styles.metadataText, 
                  { 
                    color: 
                      item.difficulty === 'Easy' ? '#22C55E' :
                      item.difficulty === 'Medium' ? '#F59E0B' : '#EF4444'
                  }
                ]}
              >
                {item.difficulty}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Feather name="star" size={14} color="#F59E0B" />
              <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <Text style={[styles.ingredientsText, { color: theme.colors.textSecondary }]}>
            You have {item.ingredients.filter(ingredient =>
              pantryItems.some(pantryItem => pantryItem.name.toLowerCase().includes(ingredient.name.toLowerCase()))
            ).length} of {item.ingredients.length} ingredients
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={theme.gradients.primary as any} style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="chef-hat" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Recipe Suggestions</Text>
          <Text style={styles.headerSubtitle}>Based on your pantry ingredients</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}>
          <Feather name="search" size={20} color={theme.colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search recipes..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { 
              backgroundColor: myRecipesVisible ? theme.colors.primary : theme.colors.surface,
              borderWidth: myRecipesVisible ? 0 : 1,
              borderColor: theme.colors.border
            }
          ]}
          onPress={toggleMyRecipes}
        >
          <Text 
            style={[
              styles.filterButtonText, 
              { color: myRecipesVisible ? '#FFFFFF' : theme.colors.textSecondary }
            ]}
          >
            My Recipes
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loaderText, { color: theme.colors.textSecondary }]}>
            Finding recipe suggestions...
          </Text>
        </View>
      ) : (
        <Animated.View style={[styles.recipesContainer, { opacity: fadeAnim }]}>
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="food-off" size={64} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
                No recipes found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
                {myRecipesVisible 
                  ? "You haven't submitted any recipes yet" 
                  : "Try adding more ingredients to your pantry or adjusting your search"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              renderItem={renderRecipeCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.recipesList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
            />
          )}
        </Animated.View>
      )}
      
      {/* Recipe Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {selectedRecipe && (
              <ScrollView style={styles.modalScroll}>
                <Image
                  source={{ uri: selectedRecipe.imageUrl }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                
                {selectedRecipe.status === 'pending' && (
                  <View style={styles.modalPendingBadge}>
                    <Text style={styles.modalPendingText}>PENDING APPROVAL</Text>
                  </View>
                )}
                
                <View style={styles.modalBody}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {selectedRecipe.title}
                  </Text>
                  
                  <View style={styles.modalMetadata}>
                    <View style={styles.modalMetadataItem}>
                      <Feather name="clock" size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.modalMetadataText, { color: theme.colors.textSecondary }]}>
                        {selectedRecipe.cookTime} min
                      </Text>
                    </View>
                    
                    <View style={styles.modalMetadataItem}>
                      <Feather name="users" size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.modalMetadataText, { color: theme.colors.textSecondary }]}>
                        {selectedRecipe.servings} servings
                      </Text>
                    </View>
                    
                    <View style={styles.modalMetadataItem}>
                      <MaterialCommunityIcons 
                        name="chef-hat" 
                        size={16} 
                        color={
                          selectedRecipe.difficulty === 'Easy' ? '#22C55E' :
                          selectedRecipe.difficulty === 'Medium' ? '#F59E0B' : '#EF4444'
                        } 
                      />
                      <Text 
                        style={[
                          styles.modalMetadataText, 
                          { 
                            color: 
                              selectedRecipe.difficulty === 'Easy' ? '#22C55E' :
                              selectedRecipe.difficulty === 'Medium' ? '#F59E0B' : '#EF4444'
                          }
                        ]}
                      >
                        {selectedRecipe.difficulty}
                      </Text>
                    </View>
                    
                    <View style={styles.modalMetadataItem}>
                      <Feather name="star" size={16} color="#F59E0B" />
                      <Text style={[styles.modalMetadataText, { color: theme.colors.textSecondary }]}>
                        {selectedRecipe.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ingredients</Text>
                    <Text style={[styles.matchPercentage, { color: theme.colors.primary }]}>
                      {selectedRecipe.matchPercentage || 0}% match with your pantry
                    </Text>
                  </View>
                  
                  <View style={styles.ingredientsList}>
                    {selectedRecipe.ingredients.map((ingredient, index) => {
                      const isPantryMatch = pantryItems.some(item => 
                        item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                        ingredient.name.toLowerCase().includes(item.name.toLowerCase())
                      );
                      
                      return (
                        <View 
                          key={index} 
                          style={[
                            styles.ingredientItem,
                            { backgroundColor: isPantryMatch ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }
                          ]}
                        >
                          <View style={styles.ingredientCheck}>
                            {isPantryMatch ? (
                              <Feather name="check" size={16} color="#22C55E" />
                            ) : (
                              <Feather name="x" size={16} color={theme.colors.textTertiary} />
                            )}
                          </View>
                          <Text style={[styles.ingredientName, { color: theme.colors.text }]}>
                            {ingredient.name}
                          </Text>
                          <Text style={[styles.ingredientAmount, { color: theme.colors.textSecondary }]}>
                            {ingredient.amount} {ingredient.unit}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Instructions</Text>
                  </View>
                  
                  <View style={styles.instructionsList}>
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <View style={[styles.instructionNumber, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.instructionNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                          {instruction}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Add Recipe Modal */}
      <Modal
        visible={addRecipeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddRecipeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAddRecipeModalVisible(false)}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Add New Recipe</Text>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalBody}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Recipe Title</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { 
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }
                  ]}
                  placeholder="Enter recipe title"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newRecipe.title}
                  onChangeText={(text) => setNewRecipe({ ...newRecipe, title: text })}
                />
                
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={[styles.formLabel, { color: theme.colors.text }]}>Cook Time (min)</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { 
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          borderColor: theme.colors.border
                        }
                      ]}
                      placeholder="30"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={newRecipe.cookTime?.toString()}
                      onChangeText={(text) => {
                        const time = parseInt(text) || 0;
                        setNewRecipe({ ...newRecipe, cookTime: time });
                      }}
                    />
                  </View>
                  
                  <View style={styles.formColumn}>
                    <Text style={[styles.formLabel, { color: theme.colors.text }]}>Servings</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { 
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          borderColor: theme.colors.border
                        }
                      ]}
                      placeholder="4"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={newRecipe.servings?.toString()}
                      onChangeText={(text) => {
                        const servings = parseInt(text) || 0;
                        setNewRecipe({ ...newRecipe, servings });
                      }}
                    />
                  </View>
                </View>
                
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Difficulty</Text>
                <View style={styles.difficultySelector}>
                  <TouchableOpacity
                    style={[
                      styles.difficultyOption,
                      newRecipe.difficulty === 'Easy' && styles.difficultyOptionSelected,
                      { backgroundColor: newRecipe.difficulty === 'Easy' ? '#22C55E' : theme.colors.surface }
                    ]}
                    onPress={() => setNewRecipe({ ...newRecipe, difficulty: 'Easy' })}
                  >
                    <Text 
                      style={[
                        styles.difficultyText,
                        { color: newRecipe.difficulty === 'Easy' ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Easy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.difficultyOption,
                      newRecipe.difficulty === 'Medium' && styles.difficultyOptionSelected,
                      { backgroundColor: newRecipe.difficulty === 'Medium' ? '#F59E0B' : theme.colors.surface }
                    ]}
                    onPress={() => setNewRecipe({ ...newRecipe, difficulty: 'Medium' })}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: newRecipe.difficulty === 'Medium' ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Medium
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.difficultyOption,
                      newRecipe.difficulty === 'Hard' && styles.difficultyOptionSelected,
                      { backgroundColor: newRecipe.difficulty === 'Hard' ? '#EF4444' : theme.colors.surface }
                    ]}
                    onPress={() => setNewRecipe({ ...newRecipe, difficulty: 'Hard' })}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: newRecipe.difficulty === 'Hard' ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Hard
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Ingredients</Text>
                {newRecipe.ingredients?.map((ing, index) => (
                  <View key={ing.id} style={styles.addedItemRow}>
                    <Text style={[styles.addedItemText, { color: theme.colors.text }]}>
                      {ing.name} {ing.amount} {ing.unit}
                    </Text>
                    <TouchableOpacity onPress={() => removeIngredient(ing.id)}>
                      <Feather name="x-circle" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.ingredientInputRow}>
                  <TextInput
                    style={[
                      styles.ingredientInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }
                    ]}
                    placeholder="Name (e.g., Flour)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={newIngredient.name}
                    onChangeText={(text) => setNewIngredient({ ...newIngredient, name: text })}
                  />
                  <TextInput
                    style={[
                      styles.ingredientAmountInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }
                    ]}
                    placeholder="Amount"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                    value={newIngredient.amount}
                    onChangeText={(text) => setNewIngredient({ ...newIngredient, amount: text })}
                  />
                  <TextInput
                    style={[
                      styles.ingredientUnitInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }
                    ]}
                    placeholder="Unit"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={newIngredient.unit}
                    onChangeText={(text) => setNewIngredient({ ...newIngredient, unit: text })}
                  />
                  <TouchableOpacity style={styles.addSmallButton} onPress={addIngredientToRecipe}>
                    <Feather name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Instructions</Text>
                {newRecipe.instructions?.map((inst, index) => (
                  <View key={index} style={styles.addedItemRow}>
                    <Text style={[styles.addedItemText, { color: theme.colors.text }]}>
                      {index + 1}. {inst}
                    </Text>
                    <TouchableOpacity onPress={() => removeInstruction(index)}>
                      <Feather name="x-circle" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.instructionInputRow}>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }
                    ]}
                    placeholder="Enter instruction step"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={newInstruction}
                    onChangeText={setNewInstruction}
                  />
                  <TouchableOpacity style={styles.addSmallButton} onPress={addInstructionToRecipe}>
                    <Feather name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                  onPress={addNewRecipe}
                >
                  <Text style={styles.submitButtonText}>Submit Recipe</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <Animated.View style={[styles.floatingButtonContainer, { transform: [{ scale: buttonScale }] }]}>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddButtonPress}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
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
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  filterButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
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
  recipesContainer: {
    flex: 1,
  },
  recipesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  recipeCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  pendingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  recipeMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  metadataText: {
    fontSize: 13,
    marginLeft: 4,
  },
  ingredientsText: {
    fontSize: 13,
    fontStyle: 'italic',
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
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  floatingButton: {
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0, // Adjust for iPhone X safe area
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 8,
  },
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalPendingBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modalPendingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  modalMetadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  modalMetadataText: {
    fontSize: 15,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  matchPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientsList: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  ingredientCheck: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  ingredientName: {
    flex: 1,
    fontSize: 16,
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsList: {
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 50,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  formColumn: {
    flex: 1,
  },
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  difficultyOptionSelected: {
    borderColor: '#FFFFFF', // A subtle border for selected option
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientInput: {
    flex: 3,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    height: 45,
  },
  ingredientAmountInput: {
    flex: 1.5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    height: 45,
  },
  ingredientUnitInput: {
    flex: 1.5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    height: 45,
  },
  addSmallButton: {
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 8,
    marginBottom: 6,
  },
  addedItemText: {
    fontSize: 15,
    flex: 1,
  },
  instructionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
}); 

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows, borderRadius } from '../constants/Colors';
import { Recipe } from '../types/recipe';
import {
  fetchRecipeById,
  checkIsFavorite,
  addFavorite,
  removeFavorite
}
  from "../services/recipeService";
import { addMealLog } from '../services/userService';
import { AnimatedButton } from '../components/AnimatedButton';
import { Ionicons } from '@expo/vector-icons';

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { recipeId, recipe: recipeParam } = useLocalSearchParams<{ recipeId: string, recipe?: string }>();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        // First check if we have a direct recipe param
        if (recipeParam) {
          const parsedRecipe = JSON.parse(recipeParam);
          setRecipe(parsedRecipe);
          if (userId && parsedRecipe.id) {
            const favId = await checkIsFavorite(userId, parsedRecipe.id);
            setIsFavorite(!!favId);
            setFavoriteId(favId);
          }
          setLoading(false);
          return;
        }
        
        // If no recipe param, try loading from Firebase
        if (recipeId) {
          const data = await fetchRecipeById(recipeId);
          setRecipe(data);
          if (userId) {
            const favId = await checkIsFavorite(userId, recipeId);
            setIsFavorite(!!favId);
            setFavoriteId(favId);
          }
        }
      } catch (error) {
        console.error('Error loading recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [recipeId, recipeParam, userId]);

  const handleToggleFavorite = async () => {
    if (!userId || !recipe) return;
    try {
      if (isFavorite && favoriteId) {
        await removeFavorite(userId, favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        await addFavorite(userId, recipe);
        const newFavId = await checkIsFavorite(userId, recipe.id);
        setIsFavorite(true);
        setFavoriteId(newFavId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleAddToDaily = async () => {
    if (!userId || !recipe) return;
    setAdding(true);
    try {
      const offset = new Date().getTimezoneOffset();
      const today = new Date(new Date().getTime() - offset * 60 * 1000);
      const dateStr = today.toISOString().split('T')[0];

      const meal = {
        id: Date.now().toString(),
        name: recipe.title,
        calories: recipe.calories,
        protein: recipe.protein,
        fats: recipe.fats,
        carbs: recipe.carbs,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };

      await addMealLog(userId, dateStr, meal);
      Alert.alert('Success!', 'Recipe added to your daily log');
    } catch (error) {
      console.error('Error adding to daily log:', error);
      Alert.alert('Error', 'Failed to add recipe to daily log');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Recipe not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.backIcon} onPress={() => router.replace("/(tabs)")}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.favoriteIcon} onPress={handleToggleFavorite}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? colors.error : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Header Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={styles.description}>{recipe.description}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
                <Text style={styles.metaText}>{recipe.category}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.metaText}>{recipe.cookingTime} mins</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
                <Text style={styles.metaText}>{recipe.difficulty}</Text>
              </View>
            </View>
          </View>

          {/* Nutrition Stats */}
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Nutrition</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionCard}>
                <View style={[styles.nutritionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="flame" size={20} color={colors.warning} />
                </View>
                <Text style={styles.nutritionValue}>{recipe.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionCard}>
                <View style={[styles.nutritionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="restaurant" size={20} color="#FF6B6B" />
                </View>
                <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionCard}>
                <View style={[styles.nutritionIcon, { backgroundColor: 'rgba(77, 171, 247, 0.1)' }]}>
                  <Ionicons name="leaf" size={20} color="#4DABF7" />
                </View>
                <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionCard}>
                <View style={[styles.nutritionIcon, { backgroundColor: 'rgba(252, 196, 25, 0.1)' }]}>
                  <Ionicons name="water" size={20} color="#FCC419" />
                </View>
                <Text style={styles.nutritionValue}>{recipe.fats}g</Text>
                <Text style={styles.nutritionLabel}>Fats</Text>
              </View>
              <View style={styles.nutritionCard}>
                <View style={[styles.nutritionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                  <Ionicons name="nutrition-outline" size={20} color={colors.success} />
                </View>
                <Text style={styles.nutritionValue}>{recipe.fiber}g</Text>
                <Text style={styles.nutritionLabel}>Fiber</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Add to Daily Log Button */}
          <View style={styles.addButtonContainer}>
            <AnimatedButton
              variant="primary"
              onPress={handleAddToDaily}
              loading={adding}
              style={styles.addButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
              <Text style={styles.addButtonText}>Add to Today's Log</Text>
            </AnimatedButton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerContent: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  nutritionSection: {
    marginBottom: spacing.xl,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  nutritionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ingredientsList: {
    gap: spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingredientBullet: {
    marginRight: spacing.md,
  },
  ingredientText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  instructionsList: {
    gap: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  instructionNumber: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
    flex: 1,
    paddingTop: spacing.xs,
  },
  addButtonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

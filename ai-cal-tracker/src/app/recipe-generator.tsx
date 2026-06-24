import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, shadows } from '../constants/Colors';
import { Goal, DietPreference, GeneratorRecipe } from '../types/generator';
import { useGeneratorRecipes } from '../hooks/useGeneratorRecipes';
import { RecipeCard } from '../components/RecipeCard';

const POPULAR_INGREDIENTS = [
  'Chicken', 'Beef', 'Salmon', 'Rice', 'Pasta',
  'Eggs', 'Tomato', 'Potato', 'Onion', 'Spinach'
];

const GOALS: { value: Goal; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'weight_loss', label: 'Weight Loss', icon: 'trending-down' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: 'barbell' },
  { value: 'maintenance', label: 'Maintenance', icon: 'body' },
];

const DIETS: { value: DietPreference; label: string }[] = [
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'high-protein', label: 'High Protein' },
];

export default function RecipeGeneratorScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();

  const [ingredients, setIngredients] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [goal, setGoal] = useState<Goal>('muscle_gain');
  const [diet, setDiet] = useState<DietPreference>('non-vegetarian');
  
  const [calories, setCalories] = useState('500');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('40');
  const [fats, setFats] = useState('15');
  const [servings, setServings] = useState('4');

  const {
    recipes,
    loading,
    error,
    generatedRecipe,
    generating,
    searchRecipes,
    generateRecipe,
    refresh
  } = useGeneratorRecipes();

  const handleToggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const handleSearch = () => {
    const searchIngredients = [...selectedChips, ingredients].filter(Boolean).join(', ');
    if (searchIngredients) {
      searchRecipes(searchIngredients);
    }
  };

  const handleGenerateAI = () => {
    const combinedIngredients = [...selectedChips, ingredients].filter(Boolean).join(', ');
    if (combinedIngredients) {
      generateRecipe({
        ingredients: combinedIngredients,
        goal,
        calories: parseInt(calories) || 500,
        protein: parseInt(protein) || 30,
        carbs: parseInt(carbs) || 40,
        fats: parseInt(fats) || 15,
        dietPreference: diet,
        servings: parseInt(servings) || 4,
      });
    }
  };

  const mapToAppRecipe = (genRecipe: GeneratorRecipe) => {
    // Ensure difficulty is one of the allowed types
    const difficulty: 'Easy' | 'Medium' | 'Hard' = 
      (genRecipe.difficulty === 'Easy' || genRecipe.difficulty === 'Medium' || genRecipe.difficulty === 'Hard') 
        ? genRecipe.difficulty 
        : 'Medium';
    
    // Parse nutrition values
    const parseNutrition = (val: string | undefined) => {
      if (!val) return 0;
      const num = parseInt(val.replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    return {
      id: genRecipe.idMeal || genRecipe.id || Math.random().toString(),
      title: genRecipe.name,
      description: genRecipe.description || 'Delicious recipe generated just for you.',
      imageUrl: genRecipe.image || 'https://images.unsplash.com/photo-1495147466023-ff5a44336585',
      calories: genRecipe.nutrition?.calories || 0,
      protein: parseNutrition(genRecipe.nutrition?.protein),
      carbs: parseNutrition(genRecipe.nutrition?.carbs),
      fats: parseNutrition(genRecipe.nutrition?.fat),
      fiber: parseNutrition(genRecipe.nutrition?.fiber),
      category: genRecipe.category || 'Healthy',
      difficulty,
      cookingTime: parseInt(genRecipe.cookTime || '20'),
      servings: genRecipe.servings || 1,
      ingredients: genRecipe.ingredients || [],
      instructions: genRecipe.instructions || [],
      createdAt: new Date().toISOString(),
    };
  };

  const handleRecipePress = (genRecipe: GeneratorRecipe) => {
    const recipe = mapToAppRecipe(genRecipe);
    router.push({
      pathname: '/recipe-details',
      params: { recipe: JSON.stringify(recipe) }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen 
        options={{
          title: 'Recipe Generator',
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🍽️ AI Nutrition Recipe Generator</Text>
          <Text style={styles.headerSubtitle}>Personalized meals based on your goals and macros</Text>
        </View>

        <View style={styles.card}>
          {/* Ingredients Input */}
          <View style={styles.section}>
            <Text style={styles.label}>What ingredients do you have?</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={ingredients}
                onChangeText={setIngredients}
                placeholder="e.g., chicken, rice, tomato..."
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleSearch}
              />
            </View>
          </View>

          {/* Popular Ingredients */}
          <View style={styles.section}>
            <Text style={styles.label}>Popular Ingredients</Text>
            <View style={styles.chipContainer}>
              {POPULAR_INGREDIENTS.map((chip) => {
                const isSelected = selectedChips.includes(chip);
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleToggleChip(chip)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.label}>Fitness Goal</Text>
            <View style={styles.chipContainer}>
              {GOALS.map((g) => {
                const isSelected = goal === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.chipIcon, isSelected && styles.chipSelected]}
                    onPress={() => setGoal(g.value)}
                  >
                    <Ionicons name={g.icon} size={16} color={isSelected ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Diet Preferences */}
          <View style={styles.section}>
            <Text style={styles.label}>Diet Preference</Text>
            <View style={styles.chipContainer}>
              {DIETS.map((d) => {
                const isSelected = diet === d.value;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.chipDiet, isSelected && styles.chipDietSelected]}
                    onPress={() => setDiet(d.value)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Calories</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={calories} onChangeText={setCalories} />
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Protein (g)</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={protein} onChangeText={setProtein} />
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Carbs (g)</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={carbs} onChangeText={setCarbs} />
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Fats (g)</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={fats} onChangeText={setFats} />
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Servings</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={servings} onChangeText={setServings} />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.searchButton]} 
              onPress={handleSearch}
              disabled={loading || generating}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="restaurant" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Find Recipes</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.aiButton]} 
              onPress={handleGenerateAI}
              disabled={loading || generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>AI Create</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Area */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>🍴</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#16a34a" />
              <Text style={styles.refreshButtonText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}

        {generatedRecipe && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Ionicons name="sparkles" size={24} color="#9333ea" />
              <Text style={styles.resultsTitle}>Your AI-Created Recipe</Text>
            </View>
            <RecipeCard recipe={mapToAppRecipe(generatedRecipe)} onPress={() => handleRecipePress(generatedRecipe)} />
          </View>
        )}

        {recipes.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Found Recipes</Text>
            {recipes.map((r, i) => (
              <RecipeCard key={r.idMeal || i} recipe={mapToAppRecipe(r)} onPress={() => handleRecipePress(r)} />
            ))}
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#16a34a', // green-600
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dcfce7', // green-100
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    ...shadows.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipDiet: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  chipDietSelected: {
    backgroundColor: '#9333ea', // purple-600
    borderColor: '#9333ea',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#fff',
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  macroBox: {
    flex: 1,
    minWidth: '28%',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  macroInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    height: 36,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  searchButton: {
    backgroundColor: '#16a34a',
  },
  aiButton: {
    backgroundColor: '#9333ea',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshButtonText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  resultsSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});

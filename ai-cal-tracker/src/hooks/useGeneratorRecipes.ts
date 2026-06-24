import { useState } from 'react';
import { GeneratorRecipe, UserPreferences } from '../types/generator';
import { searchRecipesByIngredients } from '../services/mealDbService';
import { getFreeAiRecipe } from '../services/freeAiRecipes';

export const useGeneratorRecipes = () => {
  const [recipes, setRecipes] = useState<GeneratorRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratorRecipe | null>(null);
  const [generating, setGenerating] = useState(false);

  const searchRecipes = async (ingredients: string) => {
    setLoading(true);
    setError(null);
    setGeneratedRecipe(null);
    
    try {
      const results = await searchRecipesByIngredients(ingredients);
      setRecipes(results);
      
      if (results.length === 0) {
        setError('No recipes found');
      }
    } catch (err) {
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const generateRecipe = async (preferences: UserPreferences) => {
    setGenerating(true);
    setError(null);
    
    try {
      // Use FREE built-in recipes first! No API key needed!
      const recipe = getFreeAiRecipe(preferences.ingredients, preferences.goal);
      setGeneratedRecipe(recipe);
      // saveGeneratedRecipe(recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
    } finally {
      setGenerating(false);
    }
  };

  const refresh = () => {
    setRecipes([]);
    setGeneratedRecipe(null);
    setError(null);
  };

  return {
    recipes,
    loading,
    error,
    generatedRecipe,
    generating,
    searchRecipes,
    generateRecipe,
    refresh,
  };
};

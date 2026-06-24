import { useState } from 'react';
import { Recipe, UserPreferences } from '../types';
import { searchRecipesByIngredients } from '../services/mealDbService';
import { generateAIRecipe } from '../services/aiService';
import { getFreeAiRecipe } from '../services/freeAiRecipes';
import { addToRecent, saveGeneratedRecipe } from '../services/storageService';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
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

  const generateRecipe = async (preferences: UserPreferences, apiKey: string) => {
    setGenerating(true);
    setError(null);
    
    try {
      // Use FREE built-in recipes first! No API key needed!
      const recipe = getFreeAiRecipe(preferences.ingredients, preferences.goal);
      setGeneratedRecipe(recipe);
      saveGeneratedRecipe(recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
    } finally {
      setGenerating(false);
    }
  };

  const viewRecipe = (recipe: Recipe) => {
    addToRecent(recipe);
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
    viewRecipe,
    refresh,
  };
};

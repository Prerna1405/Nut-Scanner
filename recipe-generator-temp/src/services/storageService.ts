import { Recipe } from '../types';

const FAVORITES_KEY = 'recipe_favorites';
const SAVED_KEY = 'recipe_saved';
const RECENT_KEY = 'recipe_recent';
const GENERATED_KEY = 'recipe_generated';

export const getFavorites = (): Recipe[] => {
  const data = localStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveFavorite = (recipe: Recipe): void => {
  const favorites = getFavorites();
  const exists = favorites.find(r => r.idMeal === recipe.idMeal || r.name === recipe.name);
  if (!exists) {
    favorites.unshift({ ...recipe, isFavorite: true });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
};

export const removeFavorite = (recipeId: string): void => {
  const favorites = getFavorites().filter(r => r.idMeal !== recipeId && r.name !== recipeId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

export const getSavedRecipes = (): Recipe[] => {
  const data = localStorage.getItem(SAVED_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecipe = (recipe: Recipe): void => {
  const saved = getSavedRecipes();
  const exists = saved.find(r => r.idMeal === recipe.idMeal || r.name === recipe.name);
  if (!exists) {
    saved.unshift({ ...recipe, isSaved: true });
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }
};

export const addToRecent = (recipe: Recipe): void => {
  const recent = getRecentRecipes();
  const filtered = recent.filter(r => r.idMeal !== recipe.idMeal && r.name !== recipe.name);
  filtered.unshift({ ...recipe, viewedAt: new Date().toISOString() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 20)));
};

export const getRecentRecipes = (): Recipe[] => {
  const data = localStorage.getItem(RECENT_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveGeneratedRecipe = (recipe: Recipe): void => {
  const generated = getGeneratedRecipes();
  generated.unshift({ ...recipe, isGenerated: true });
  localStorage.setItem(GENERATED_KEY, JSON.stringify(generated.slice(0, 50)));
};

export const getGeneratedRecipes = (): Recipe[] => {
  const data = localStorage.getItem(GENERATED_KEY);
  return data ? JSON.parse(data) : [];
};

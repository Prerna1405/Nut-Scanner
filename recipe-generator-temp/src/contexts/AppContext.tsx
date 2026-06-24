import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe } from '../types';
import { getFavorites, saveFavorite, removeFavorite, getSavedRecipes, saveRecipe } from '../services/storageService';

interface AppContextType {
  favorites: Recipe[];
  savedRecipes: Recipe[];
  toggleFavorite: (recipe: Recipe) => void;
  isFavorite: (recipe: Recipe) => boolean;
  saveRecipeToLibrary: (recipe: Recipe) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    setSavedRecipes(getSavedRecipes());
  }, []);

  const toggleFavorite = (recipe: Recipe) => {
    if (isFavorite(recipe)) {
      removeFavorite(recipe.idMeal || recipe.name);
      setFavorites(getFavorites());
    } else {
      saveFavorite(recipe);
      setFavorites(getFavorites());
    }
  };

  const isFavorite = (recipe: Recipe) => {
    return favorites.some(r => r.idMeal === recipe.idMeal || r.name === recipe.name);
  };

  const saveRecipeToLibrary = (recipe: Recipe) => {
    saveRecipe(recipe);
    setSavedRecipes(getSavedRecipes());
  };

  return (
    <AppContext.Provider value={{
      favorites, savedRecipes, toggleFavorite, isFavorite, saveRecipeToLibrary }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

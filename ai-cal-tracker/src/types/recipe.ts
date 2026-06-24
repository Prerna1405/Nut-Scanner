export interface Recipe {
  id: string;
  userId?: string;
  title: string;
  description: string;
  imageUrl: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime?: number;
  cookingTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  createdAt: string;
}

export interface RecipePreview {
  id: string;
  title: string;
  description: string;
  time: string;
  servings: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface FavoriteRecipe {
  id: string;
  userId: string;
  recipeId: string;
  recipe: Recipe;
  createdAt: string;
}

export interface UserRecipeHistory {
  id: string;
  userId: string;
  recipeId: string;
  recipe: Recipe;
  viewedAt: string;
}

export const CATEGORIES = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'High Protein',
  'Weight Loss',
  'Weight Gain',
  'Low Carb',
  'Vegetarian',
  'Vegan',
  'Indian',
];

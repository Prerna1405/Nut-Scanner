export type Goal = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type DietPreference = 'vegetarian' | 'vegan' | 'non-vegetarian' | 'keto' | 'high-protein';

export interface GeneratorRecipe {
  id?: string;
  idMeal?: string;
  name: string;
  description?: string;
  category?: string;
  cuisine?: string;
  image?: string;
  imageUrl?: string;
  instructions: string[];
  ingredients: string[];
  youtube?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string;
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber?: string;
    sugar?: string;
  };
  isGenerated?: boolean;
  fitnessBenefits?: string;
  ingredientAlternatives?: string[];
  imagePrompt?: string;
  scores?: {
    proteinScore: number;
    healthScore: number;
    goalCompatibilityScore: number;
    overallScore: number;
  };
  icon?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags?: string[];
}

export interface UserPreferences {
  ingredients: string;
  goal: Goal;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  dietPreference: DietPreference;
  servings: number;
}

export interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strYoutube: string;
  [key: string]: string | null;
}

import { MealDBMeal, Recipe } from '../types';

const MEAL_DB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export const searchRecipesByIngredients = async (ingredients: string): Promise<Recipe[]> => {
  const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
  const response = await fetch(`${MEAL_DB_BASE}/filter.php?i=${encodeURIComponent(ingredientList[0])}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }

  const data = await response.json();
  if (!data.meals) return [];

  const recipes = await Promise.all(
    data.meals.slice(0, 8).map(async (meal: any) => {
      return await getRecipeById(meal.idMeal);
    })
  );

  return recipes.filter(Boolean) as Recipe[];
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  const response = await fetch(`${MEAL_DB_BASE}/lookup.php?i=${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recipe details');
  }

  const data = await response.json();
  if (!data.meals || data.meals.length === 0) return null;

  return transformMealDBRecipe(data.meals[0]);
};

const transformMealDBRecipe = (meal: MealDBMeal): Recipe => {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure} ${ingredient}`.trim());
    }
  }

  return {
    idMeal: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory,
    cuisine: meal.strArea,
    image: meal.strMealThumb,
    instructions: meal.strInstructions.split('\n').filter(s => s.trim()),
    ingredients,
    youtube: meal.strYoutube,
    nutrition: estimateNutrition(ingredients),
    isGenerated: false,
  };
};

const estimateNutrition = (ingredients: string[]): Nutrition => {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  ingredients.forEach(ing => {
    const lower = ing.toLowerCase();
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('fish')) {
      protein += 30;
      calories += 150;
    }
    if (lower.includes('rice') || lower.includes('pasta') || lower.includes('bread')) {
      carbs += 40;
      calories += 200;
    }
    if (lower.includes('oil') || lower.includes('butter')) {
      fat += 15;
      calories += 150;
    }
    if (lower.includes('vegetable') || lower.includes('tomato') || lower.includes('onion') || lower.includes('carrot')) {
      carbs += 10;
      calories += 50;
    }
  });

  return {
    calories: Math.round(calories / 4),
    protein: `${Math.round(protein / 4)}g`,
    carbs: `${Math.round(carbs / 4)}g`,
    fat: `${Math.round(fat / 4)}g`,
  };
};

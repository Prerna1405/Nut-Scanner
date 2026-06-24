import { MealDBMeal, GeneratorRecipe as Recipe } from '../types/generator';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Define Nutrition type locally since it's not exported from generator.ts
type Nutrition = {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  sugar?: string;
};

export const searchRecipesByIngredients = async (ingredients: string): Promise<Recipe[]> => {
  try {
    const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    const response = await fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredientList[0])}`);
    
    if (!response.ok) {
      return getFallbackRecipes();
    }

    const data = await response.json();
    if (!data.meals) return getFallbackRecipes();

    const recipes = await Promise.all(
      data.meals.slice(0, 8).map(async (meal: any) => {
        return await getRecipeById(meal.idMeal);
      })
    );

    const validRecipes = recipes.filter(Boolean) as Recipe[];
    return validRecipes.length > 0 ? validRecipes : getFallbackRecipes();
  } catch (err) {
    return getFallbackRecipes();
  }
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.meals || data.meals.length === 0) return null;

    return transformMealDBRecipe(data.meals[0]);
  } catch (err) {
    return null;
  }
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
    instructions: meal.strInstructions ? meal.strInstructions.split('\n').filter(s => s.trim()) : [],
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

// Fallback recipes in case MealDB is down
const getFallbackRecipes = (): Recipe[] => {
  return [
    {
      idMeal: "fallback-1",
      name: "Grilled Chicken Salad",
      category: "Chicken",
      cuisine: "American",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      instructions: ["Grill chicken breast until cooked through", "Toss mixed greens with olive oil and balsamic vinegar", "Top with sliced chicken and serve"],
      ingredients: ["Chicken breast 150g", "Mixed greens 2 cups", "Olive oil 1 tbsp", "Balsamic vinegar 1 tsp"],
      nutrition: { calories: 350, protein: "30g", carbs: "10g", fat: "15g" },
      isGenerated: true,
    },
    {
      idMeal: "fallback-2",
      name: "Vegetable Stir Fry",
      category: "Vegetarian",
      cuisine: "Asian",
      image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400",
      instructions: ["Stir fry all vegetables in a wok", "Add soy sauce and serve hot"],
      ingredients: ["Broccoli 1 cup", "Bell peppers 1 cup", "Carrots ½ cup", "Soy sauce 1 tbsp"],
      nutrition: { calories: 200, protein: "8g", carbs: "25g", fat: "8g" },
      isGenerated: true,
    }
  ];
};

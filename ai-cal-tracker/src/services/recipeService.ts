import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  arrayUnion,
} from 'firebase/firestore';
import { Recipe, RecipePreview, FavoriteRecipe, UserRecipeHistory } from '../types/recipe';
import { getFreeAiRecipe } from './freeAiRecipes';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateRecipe(ingredients: string[]) {
  const res = await fetch('http://localhost:5000/recipe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ingredients }),
  });

  return await res.json();
}

export async function generateRecipePreviews(ingredients: string): Promise<RecipePreview[]> {
  try {
    // First, try to use the free recipe generator if API key is not available
    if (!apiKey) {
      // Fallback to some static previews
      return [
        {
          id: '1',
          title: 'Quick Vegetable Stir Fry',
          description: 'A simple, healthy stir fry with your available veggies.',
          time: '20 mins',
          servings: '2',
          difficulty: 'Easy',
        },
        {
          id: '2',
          title: 'Protein-Packed Bowl',
          description: 'A balanced bowl with protein, veggies, and grains.',
          time: '25 mins',
          servings: '2',
          difficulty: 'Medium',
        },
        {
          id: '3',
          title: 'Creamy Pasta',
          description: 'Comforting pasta dish with your ingredients.',
          time: '30 mins',
          servings: '4',
          difficulty: 'Medium',
        },
      ];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
Generate 3 recipe previews based on these ingredients: ${ingredients}

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "previews": [
    {
      "id": "1",
      "title": "Recipe Name",
      "description": "Short 1-2 sentence description",
      "time": "20 mins",
      "servings": "2",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    return data.previews;
  } catch (error) {
    console.error('Error generating previews:', error);
    // Fallback
    return [
      {
        id: '1',
        title: 'Simple Ingredient Meal',
        description: 'A quick meal with your available ingredients.',
        time: '20 mins',
        servings: '2',
        difficulty: 'Easy',
      },
    ];
  }
}

export async function generateAIRecipe(preview: RecipePreview, ingredients: string): Promise<Recipe> {
  try {
    // Use free recipe generator as fallback
    const freeRecipe = getFreeAiRecipe(ingredients, 'maintenance');
    return {
      id: Date.now().toString(),
      title: preview.title,
      description: preview.description,
      imageUrl: freeRecipe.image || 'https://images.unsplash.com/photo-1495521821758-187c537f98e9?w=800',
      calories: freeRecipe.nutrition?.calories || 400,
      protein: parseInt(freeRecipe.nutrition?.protein || '30'),
      carbs: parseInt(freeRecipe.nutrition?.carbs || '40'),
      fats: parseInt(freeRecipe.nutrition?.fat || '15'),
      fiber: 5,
      sugar: 0,
      category: 'Healthy',
      difficulty: preview.difficulty,
      cookingTime: parseInt(preview.time),
      servings: parseInt(preview.servings),
      ingredients: freeRecipe.ingredients || [ingredients],
      instructions: freeRecipe.instructions || ['Cook ingredients together.', 'Serve hot.'],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating AI recipe:', error);
    // Fallback
    return {
      id: Date.now().toString(),
      title: preview.title,
      description: preview.description,
      imageUrl: 'https://images.unsplash.com/photo-1495521821758-187c537f98e9?w=800',
      calories: 400,
      protein: 30,
      carbs: 40,
      fats: 15,
      fiber: 5,
      sugar: 0,
      category: 'Healthy',
      difficulty: preview.difficulty,
      cookingTime: parseInt(preview.time),
      servings: parseInt(preview.servings),
      ingredients: [ingredients],
      instructions: ['Cook ingredients together.', 'Serve hot.'],
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchRecipeById(recipeId: string): Promise<Recipe> {
  const docRef = doc(db, 'recipes', recipeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Recipe;
  }
  throw new Error('Recipe not found');
}

export async function addToHistory(userId: string, recipe: Recipe) {
  const historyId = `${userId}_${recipe.id}`;
  const historyRef = doc(db, 'recipeHistory', historyId);
  await setDoc(historyRef, {
    id: historyId,
    userId,
    recipeId: recipe.id,
    recipe,
    viewedAt: new Date().toISOString(),
  });
}

export async function fetchUserGeneratedRecipes(userId: string): Promise<Recipe[]> {
  const q = query(
    collection(db, 'recipes'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const querySnapshot = await getDocs(q);
  const recipes: Recipe[] = [];
  querySnapshot.forEach((doc) => {
    recipes.push(doc.data() as Recipe);
  });
  return recipes;
}

export async function checkIsFavorite(userId: string, recipeId: string): Promise<string | null> {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
    where('recipeId', '==', recipeId),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
  return null;
}

export async function addFavorite(userId: string, recipe: Recipe) {
  const favoriteId = `${userId}_${recipe.id}`;
  const favoriteRef = doc(db, 'favorites', favoriteId);
  await setDoc(favoriteRef, {
    id: favoriteId,
    userId,
    recipeId: recipe.id,
    recipe,
    createdAt: new Date().toISOString(),
  });
}

export async function fetchFavorites(userId: string): Promise<FavoriteRecipe[]> {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const querySnapshot = await getDocs(q);
  const favorites: FavoriteRecipe[] = [];
  querySnapshot.forEach((doc) => {
    favorites.push(doc.data() as FavoriteRecipe);
  });
  return favorites;
}

export async function fetchHistory(userId: string): Promise<UserRecipeHistory[]> {
  const q = query(
    collection(db, 'recipeHistory'),
    where('userId', '==', userId),
    orderBy('viewedAt', 'desc'),
    limit(50)
  );
  const querySnapshot = await getDocs(q);
  const history: UserRecipeHistory[] = [];
  querySnapshot.forEach((doc) => {
    history.push(doc.data() as UserRecipeHistory);
  });
  return history;
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const favoriteRef = doc(db, 'favorites', favoriteId);
  await deleteDoc(favoriteRef);
}

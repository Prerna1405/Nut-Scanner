import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDiverseRecipe } from '../services/freeAiRecipes';
import type { GeneratorRecipe } from '../types/generator';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very-active';
  goal: 'weight-loss' | 'weight-gain' | 'muscle-gain' | 'maintenance';
  dailyCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  dietaryPreferences: string[];
}

export interface MealLog {
  id: string;
  day: string;
  mealType: (typeof MEAL_TYPES)[number];
  status: 'ate' | 'skipped' | null;
  rating?: number;
  favorite?: boolean;
}

export interface MealPlan {
  [day: string]: {
    [mealType in (typeof MEAL_TYPES)[number]]: GeneratorRecipe | null;
  };
}

const PROFILE_KEY = '@meal_planner_profile';
const PLAN_KEY = '@meal_planner_plan';
const LOGS_KEY = '@meal_planner_logs';

export function useMealPlanner() {
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: 25,
    gender: 'male',
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintenance',
    dailyCalories: 2200,
    proteinTarget: 150,
    carbsTarget: 230,
    fatTarget: 65,
    dietaryPreferences: ['high-protein']
  });

  const [mealPlan, setMealPlan] = useState<MealPlan>(() => {
    const initial: any = {};
    DAYS.forEach(day => {
      initial[day] = { breakfast: null, lunch: null, dinner: null, snack: null };
    });
    return initial;
  });

  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, m, l] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(PLAN_KEY),
          AsyncStorage.getItem(LOGS_KEY)
        ]);
        if (p) setUserProfile(JSON.parse(p));
        if (m) setMealPlan(JSON.parse(m));
        if (l) setMealLogs(JSON.parse(l));
      } catch (e) {
        console.error('Failed to load meal planner data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  };

  const savePlan = async (plan: MealPlan) => {
    setMealPlan(plan);
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  };

  const saveLogs = async (logs: MealLog[]) => {
    setMealLogs(logs);
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  };

  const usedRecipeNames = useMemo(() => {
    const names: string[] = [];
    DAYS.forEach(day => {
      MEAL_TYPES.forEach(mealType => {
        if (mealPlan[day]?.[mealType]) {
          names.push(mealPlan[day][mealType]!.name);
        }
      });
    });
    return names;
  }, [mealPlan]);

  const generateWeekPlan = async (mealPrepMode: boolean) => {
    const newPlan: MealPlan = { ...mealPlan };
    const used: string[] = [];

    DAYS.forEach(day => {
      if (!newPlan[day]) newPlan[day] = { breakfast: null, lunch: null, dinner: null, snack: null };
      
      MEAL_TYPES.forEach(mealType => {
        if (mealPrepMode && mealType === 'lunch' && newPlan['Monday']?.lunch) {
          newPlan[day][mealType] = newPlan['Monday'].lunch;
        } else {
          const recipe = getDiverseRecipe(mealType, used, userProfile.goal);
          newPlan[day][mealType] = recipe;
          used.push(recipe.name);
        }
      });
    });

    await savePlan(newPlan);
  };

  const replaceMeal = async (day: string, mealType: (typeof MEAL_TYPES)[number]) => {
    const recipe = getDiverseRecipe(mealType, usedRecipeNames, userProfile.goal);
    const newPlan = {
      ...mealPlan,
      [day]: { ...mealPlan[day], [mealType]: recipe }
    };
    await savePlan(newPlan);
  };

  const logMeal = async (day: string, mealType: (typeof MEAL_TYPES)[number], status: 'ate' | 'skipped') => {
    const id = `${day}-${mealType}`;
    const existing = mealLogs.find(l => l.id === id);
    let newLogs;
    if (existing) {
      newLogs = mealLogs.map(l => l.id === id ? { ...l, status } : l);
    } else {
      newLogs = [...mealLogs, { id, day, mealType, status }];
    }
    await saveLogs(newLogs);
  };

  const toggleFavorite = async (day: string, mealType: (typeof MEAL_TYPES)[number]) => {
    const id = `${day}-${mealType}`;
    const existing = mealLogs.find(l => l.id === id);
    let newLogs;
    if (existing) {
      newLogs = mealLogs.map(l => l.id === id ? { ...l, favorite: !l.favorite } : l);
    } else {
      newLogs = [...mealLogs, { id, day, mealType, status: null, favorite: true }];
    }
    await saveLogs(newLogs);
  };

  const getDailyNutrition = (day: string) => {
    let cals = 0, protein = 0, carbs = 0, fat = 0;
    if (mealPlan[day]) {
      MEAL_TYPES.forEach(mealType => {
        const meal = mealPlan[day][mealType];
        if (meal && meal.nutrition) {
          cals += meal.nutrition.calories || 0;
          protein += parseInt(meal.nutrition.protein as string) || 0;
          carbs += parseInt(meal.nutrition.carbs as string) || 0;
          fat += parseInt(meal.nutrition.fat as string) || 0;
        }
      });
    }
    return { cals, protein, carbs, fat };
  };

  return {
    loading,
    userProfile,
    mealPlan,
    mealLogs,
    saveProfile,
    generateWeekPlan,
    replaceMeal,
    logMeal,
    toggleFavorite,
    getDailyNutrition
  };
}

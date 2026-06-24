import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  ChefHat,
  Calendar,
  ShoppingCart,
  Sparkles,
  BarChart3,
  UtensilsCrossed,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getDiverseRecipe, type Recipe } from '../services/freeAiRecipes';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

interface UserProfile {
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

interface MealLog {
  id: string;
  day: string;
  mealType: (typeof MEAL_TYPES)[number];
  status: 'ate' | 'skipped' | null;
  rating?: number;
  favorite?: boolean;
}

interface MealPlan {
  [day: string]: {
    [mealType in (typeof MEAL_TYPES)[number]]: Recipe | null;
  };
}

export default function MealPlanner() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) return JSON.parse(saved);
    return {
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
    };
  });

  const [mealPlan, setMealPlan] = useState<MealPlan>(() => {
    const saved = localStorage.getItem('mealPlan');
    if (saved) return JSON.parse(saved);
    const initial: MealPlan = {};
    DAYS.forEach(day => {
      initial[day] = { breakfast: null, lunch: null, dinner: null, snack: null };
    });
    return initial;
  });

  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('mealLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [expandedDay, setExpandedDay] = useState<string>('Monday');
  const [mealPrepMode, setMealPrepMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const usedRecipeNames = useMemo(() => {
    const names: string[] = [];
    DAYS.forEach(day => {
      MEAL_TYPES.forEach(mealType => {
        if (mealPlan[day][mealType]) {
          names.push(mealPlan[day][mealType].name);
        }
      });
    });
    return names;
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('mealLogs', JSON.stringify(mealLogs));
  }, [mealLogs]);

  const generateWeekPlan = () => {
    const newPlan: MealPlan = {};
    const used: string[] = [];

    DAYS.forEach(day => {
      newPlan[day] = { breakfast: null, lunch: null, dinner: null, snack: null };
      
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

    setMealPlan(newPlan);
  };

  const replaceMeal = (day: string, mealType: (typeof MEAL_TYPES)[number]) => {
    const recipe = getDiverseRecipe(mealType, usedRecipeNames, userProfile.goal);
    setMealPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [mealType]: recipe }
    }));
  };

  const logMeal = (day: string, mealType: (typeof MEAL_TYPES)[number], status: 'ate' | 'skipped') => {
    const id = `${day}-${mealType}`;
    setMealLogs(prev => {
      const existing = prev.find(l => l.id === id);
      if (existing) {
        return prev.map(l => l.id === id ? { ...l, status } : l);
      }
      return [...prev, { id, day, mealType, status }];
    });
  };

  const toggleFavorite = (day: string, mealType: (typeof MEAL_TYPES)[number]) => {
    const id = `${day}-${mealType}`;
    setMealLogs(prev => {
      const existing = prev.find(l => l.id === id);
      if (existing) {
        return prev.map(l => l.id === id ? { ...l, favorite: !l.favorite } : l);
      }
      return [...prev, { id, day, mealType, status: null, favorite: true }];
    });
  };

  const getDailyNutrition = (day: string) => {
    let cals = 0, protein = 0, carbs = 0, fat = 0;
    MEAL_TYPES.forEach(mealType => {
      const meal = mealPlan[day][mealType];
      if (meal) {
        cals += meal.nutrition.calories;
        protein += parseInt(meal.nutrition.protein);
        carbs += parseInt(meal.nutrition.carbs);
        fat += parseInt(meal.nutrition.fat);
      }
    });
    return { cals, protein, carbs, fat };
  };

  const aiInsights = useMemo(() => [
    { text: "You usually skip breakfast. Consider high-protein smoothies for quick energy!", icon: "💡" },
    { text: "Your protein target is 95% achieved this week! Great job!", icon: "💪" },
    { text: "Meal variety score: 92/100. Excellent diversity!", icon: "🎯" }
  ], []);

  const weeklyStats = useMemo(() => {
    let totalCals = 0, totalProtein = 0;
    DAYS.forEach(day => {
      const nut = getDailyNutrition(day);
      totalCals += nut.cals;
      totalProtein += nut.protein;
    });
    return { avgCals: Math.round(totalCals / 7), avgProtein: Math.round(totalProtein / 7) };
  }, [mealPlan]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 pb-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              <span className="text-green-600">AI</span> Meal Planner
            </h1>
            <p className="text-gray-500">Your Personal Nutrition Coach</p>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
          >
            <User className="w-5 h-5" />
            Profile
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-green-700">89%</div>
            <div className="text-sm text-green-600 opacity-80">Adherence</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-700">{weeklyStats.avgCals}</div>
            <div className="text-sm text-orange-600 opacity-80">Avg Calories</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border border-red-200">
            <div className="text-3xl mb-2">🥩</div>
            <div className="text-2xl font-bold text-red-700">{weeklyStats.avgProtein}g</div>
            <div className="text-sm text-red-600 opacity-80">Avg Protein</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border border-emerald-200">
            <div className="text-3xl mb-2">🥗</div>
            <div className="text-2xl font-bold text-emerald-700">72%</div>
            <div className="text-sm text-emerald-600 opacity-80">Pantry Usage</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-purple-700">{userProfile.goal.replace('-', ' ')}</div>
            <div className="text-sm text-purple-600 opacity-80 capitalize">Goal</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">AI Insights</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                {aiInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5">{insight.icon}</span>
                    <span>{insight.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8 flex flex-wrap items-center gap-3">
          <button
            onClick={generateWeekPlan}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Week
          </button>
          <button
            onClick={() => setMealPrepMode(!mealPrepMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              mealPrepMode ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            {mealPrepMode ? 'Meal Prep: ON' : 'Meal Prep: OFF'}
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Generate Shopping List
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-8 pb-2">
          {DAYS.map(day => {
            const nut = getDailyNutrition(day);
            return (
              <button
                key={day}
                onClick={() => setExpandedDay(day)}
                className={`flex-shrink-0 p-4 rounded-2xl transition-all ${
                  expandedDay === day
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-white border border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="font-semibold text-lg">{day.slice(0, 3)}</div>
                <div className={`text-sm ${expandedDay === day ? 'text-green-100' : 'text-gray-500'}`}>
                  {nut.cals} cal • {nut.protein}g protein
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${Math.min(100, (nut.cals / userProfile.dailyCalories) * 100)}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  {expandedDay}
                </h2>
                <p className="text-gray-500">Your meal plan for the day</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Daily Target</div>
                <div className="text-lg font-bold text-gray-900">
                  {userProfile.dailyCalories} cal • {userProfile.proteinTarget}g protein
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              {['Calories', 'Protein', 'Carbs', 'Fat'].map((label, i) => {
                const target = i === 0 ? userProfile.dailyCalories : i === 1 ? userProfile.proteinTarget : i === 2 ? userProfile.carbsTarget : userProfile.fatTarget;
                const current = i === 0 ? getDailyNutrition(expandedDay).cals : i === 1 ? getDailyNutrition(expandedDay).protein : i === 2 ? getDailyNutrition(expandedDay).carbs : getDailyNutrition(expandedDay).fat;
                const colors = ['orange', 'red', 'yellow', 'blue'];
                return (
                  <div key={label} className={`p-4 bg-${colors[i]}-50 rounded-xl`}>
                    <div className="text-sm text-gray-600">{label}</div>
                    <div className="text-xl font-bold text-gray-900">{current} / {target}{i > 0 ? 'g' : ''}</div>
                    <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r" style={{ width: `${Math.min(100, (current / target) * 100)}%`, background: `linear-gradient(90deg, #10b981, #059669)` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MEAL_TYPES.map(mealType => {
                const meal = mealPlan[expandedDay][mealType];
                const log = mealLogs.find(l => l.id === `${expandedDay}-${mealType}`);
                return (
                  <div
                    key={mealType}
                    className={`p-5 rounded-2xl border transition-all ${
                      log?.status === 'ate' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {mealType}
                      </h3>
                      {meal && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => logMeal(expandedDay, mealType, 'ate')}
                            className={`p-2 rounded-lg transition-colors ${
                              log?.status === 'ate' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 hover:bg-green-50'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => logMeal(expandedDay, mealType, 'skipped')}
                            className={`p-2 rounded-lg transition-colors ${
                              log?.status === 'skipped' ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 hover:bg-red-50'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(expandedDay, mealType)}
                            className={`p-2 rounded-lg transition-colors ${
                              log?.favorite ? 'bg-pink-100 text-pink-600' : 'bg-white border border-gray-200 hover:bg-pink-50'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${log?.favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => replaceMeal(expandedDay, mealType)}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {meal ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{meal.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{meal.name}</h4>
                            <p className="text-sm text-gray-600">{meal.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-700">
                              <span className="font-semibold text-orange-600">{meal.nutrition.calories} cal</span>
                              <span className="font-semibold text-red-600">{meal.nutrition.protein} protein</span>
                              <span className="text-gray-500">{meal.cuisine} • {meal.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const recipe = getDiverseRecipe(mealType, usedRecipeNames, userProfile.goal);
                          setMealPlan(prev => ({
                            ...prev,
                            [expandedDay]: { ...prev[expandedDay], [mealType]: recipe }
                          }));
                        }}
                        className="w-full py-6 text-center border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50"
                      >
                        <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <span className="text-gray-600 font-medium">Add Meal</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          profile={userProfile}
          onSave={setUserProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

function ProfileModal({ profile, onSave, onClose }: { profile: UserProfile; onSave: (p: UserProfile) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <button
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

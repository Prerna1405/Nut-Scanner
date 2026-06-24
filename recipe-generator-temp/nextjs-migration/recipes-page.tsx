'use client'

import { useState } from 'react'
import { Search, ChefHat, Sparkles, RefreshCw, Target, TrendingUp, Activity } from 'lucide-react'
import RecipeCard from '@/components/RecipeCard'
import Skeleton from '@/components/Skeleton'
import { useRecipes } from '@/lib/hooks/useRecipes'
import { useRouter } from 'next/navigation'
import { Recipe, Goal, DietPreference } from '@/lib/types'

const POPULAR_INGREDIENTS = [
  'Chicken', 'Beef', 'Salmon', 'Rice', 'Pasta',
  'Eggs', 'Tomato', 'Potato', 'Onion', 'Spinach'
]

const GOALS: { value: Goal; label: string; icon: typeof Target }[] = [
  { value: 'weight_loss', label: 'Weight Loss', icon: TrendingUp },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: Activity },
  { value: 'maintenance', label: 'Maintenance', icon: Target },
]

const DIETS: { value: DietPreference; label: string }[] = [
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'high-protein', label: 'High Protein' },
]

export default function RecipesPage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState('')
  const [selectedChips, setSelectedChips] = useState<string[]>([])
  const [goal, setGoal] = useState<Goal>('muscle_gain')
  const [diet, setDiet] = useState<DietPreference>('non-vegetarian')
  const [calories, setCalories] = useState<number>(500)
  const [protein, setProtein] = useState<number>(30)
  const [carbs, setCarbs] = useState<number>(40)
  const [fats, setFats] = useState<number>(15)
  const [servings, setServings] = useState<number>(4)

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

  const { recipes, loading, error, generatedRecipe, generating, searchRecipes, generateRecipe, viewRecipe, refresh } = useRecipes()

  const handleToggleChip = (chip: string) => {
    setSelectedChips(prev => {
      if (prev.includes(chip)) {
        return prev.filter(c => c !== chip)
      }
      return [...prev, chip]
    })
  }

  const handleSearch = () => {
    const searchIngredients = [...selectedChips, ingredients].filter(Boolean).join(', ')
    if (searchIngredients) {
      searchRecipes(searchIngredients)
    }
  }

  const handleGenerateAI = () => {
    const combinedIngredients = [...selectedChips, ingredients].filter(Boolean).join(', ')
    if (combinedIngredients && apiKey) {
      generateRecipe(
        {
          ingredients: combinedIngredients,
          goal,
          calories,
          protein,
          carbs,
          fats,
          dietPreference: diet,
          servings,
        },
        apiKey
      )
    }
  }

  const handleViewRecipe = (recipe: Recipe) => {
    viewRecipe(recipe)
    router.push(`/recipes/${encodeURIComponent(recipe.idMeal || recipe.name)}`, { state: { recipe } })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🍽️ AI Nutrition Recipe Generator</h1>
          <p className="text-green-100">Personalized meals based on your goals and macros</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What ingredients do you have?
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g., chicken, rice, tomato..."
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Popular Ingredients
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_INGREDIENTS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleToggleChip(chip)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedChips.includes(chip)
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Fitness Goal
              </label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const Icon = g.icon
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        goal === g.value
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {g.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Diet Preference
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDiet(d.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      diet === d.value
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fats (g)</label>
              <input
                type="number"
                value={fats}
                onChange={(e) => setFats(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Servings</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-800"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSearch}
              disabled={loading || generating}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ChefHat className="w-5 h-5" />
              {loading ? 'Searching...' : 'Find Recipes'}
            </button>
            <button
              onClick={handleGenerateAI}
              disabled={loading || generating || !apiKey}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              {generating ? 'Generating...' : 'AI Create'}
            </button>
          </div>
        </div>

        {(error || (recipes.length === 0 && !loading && !generating && (selectedChips.length > 0 || ingredients.length > 0))) && (
          <div className="bg-white rounded-2xl p-8 text-center mb-8">
            <div className="text-6xl mb-4">🍴</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {error || 'No recipes found'}
            </h3>
            <p className="text-gray-600 mb-4">
              Try adding more ingredients or let AI create a custom recipe!
            </p>
            <button
              onClick={refresh}
              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Clear search
            </button>
          </div>
        )}

        {loading && <Skeleton />}

        {generatedRecipe && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Your AI-Created Recipe
            </h2>
            <div className="max-w-md">
              <RecipeCard recipe={generatedRecipe} onClick={() => handleViewRecipe(generatedRecipe)} />
            </div>
          </div>
        )}

        {recipes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Found Recipes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.idMeal || recipe.name} recipe={recipe} onClick={() => handleViewRecipe(recipe)} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

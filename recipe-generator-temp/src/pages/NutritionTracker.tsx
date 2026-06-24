import { useState, useEffect } from 'react'
import { Plus, Trash2, Target } from 'lucide-react'

interface LoggedMeal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
}

interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export default function NutritionTracker() {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => {
    const saved = localStorage.getItem('loggedMeals')
    return saved ? JSON.parse(saved) : []
  })

  const [goals, setGoals] = useState<NutritionGoals>(() => {
    const saved = localStorage.getItem('nutritionGoals')
    return saved ? JSON.parse(saved) : {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65
    }
  })

  useEffect(() => {
    localStorage.setItem('loggedMeals', JSON.stringify(meals))
  }, [meals])

  useEffect(() => {
    localStorage.setItem('nutritionGoals', JSON.stringify(goals))
  }, [goals])

  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const addSampleMeal = () => {
    const newMeal: LoggedMeal = {
      id: Date.now().toString(),
      name: 'Sample Meal',
      calories: 500,
      protein: 30,
      carbs: 40,
      fat: 15,
      time: new Date().toLocaleTimeString()
    }
    setMeals([...meals, newMeal])
  }

  const removeMeal = (id: string) => {
    setMeals(meals.filter(meal => meal.id !== id))
  }

  const getProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Nutrition Tracker</h2>

      {/* Goals Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Goals</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Calories', current: totals.calories, goal: goals.calories, color: 'orange' },
            { label: 'Protein (g)', current: totals.protein, goal: goals.protein, color: 'red' },
            { label: 'Carbs (g)', current: totals.carbs, goal: goals.carbs, color: 'yellow' },
            { label: 'Fat (g)', current: totals.fat, goal: goals.fat, color: 'blue' }
          ].map((stat, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stat.current} / {stat.goal}</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${stat.color}-500`}
                  style={{ width: `${getProgress(stat.current, stat.goal)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(getProgress(stat.current, stat.goal))}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Logged Meals */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Logged Meals</h3>
          <button
            onClick={addSampleMeal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Sample Meal
          </button>
        </div>

        {meals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No meals logged yet!</p>
        ) : (
          <div className="space-y-3">
            {meals.map(meal => (
              <div key={meal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{meal.name}</p>
                  <p className="text-xs text-gray-500">{meal.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold mr-2">{meal.calories} cal</span>
                    <span className="mr-2">P:{meal.protein}g</span>
                    <span className="mr-2">C:{meal.carbs}g</span>
                    <span>F:{meal.fat}g</span>
                  </div>
                  <button
                    onClick={() => removeMeal(meal.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

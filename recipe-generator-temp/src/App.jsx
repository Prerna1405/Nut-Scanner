import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import RecipeHome from './pages/RecipeHome'
import RecipeDetails from './pages/RecipeDetails'
import MealPlanner from './pages/MealPlanner'
import NutritionTracker from './pages/NutritionTracker'
import ShoppingList from './pages/ShoppingList'
import Pantry from './pages/Pantry'
import { useState } from 'react'
import { ChefHat, Calendar, BarChart3, ShoppingCart, Package } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('planner')

  const tabs = [
    { id: 'planner', label: 'Meal Planner', icon: Calendar },
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'nutrition', label: 'Nutrition', icon: BarChart3 },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
    { id: 'pantry', label: 'Pantry', icon: Package }
  ]

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 pb-24">
          {/* Top Navigation */}
          <div className="sticky top-0 bg-green-600 text-white px-6 py-4 shadow-lg z-50">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold mb-3">🍽️ AI Nutrition & Meal Planner</h1>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-6 py-8">
            {activeTab === 'recipes' && <RecipeHome />}
            {activeTab === 'planner' && <MealPlanner />}
            {activeTab === 'nutrition' && <NutritionTracker />}
            {activeTab === 'shopping' && <ShoppingList />}
            {activeTab === 'pantry' && <Pantry />}
          </main>
        </div>
      </Router>
    </AppProvider>
  )
}

export default App;

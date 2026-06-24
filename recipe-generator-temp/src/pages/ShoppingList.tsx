import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  CheckSquare,
  Square,
  ShoppingCart,
  Trash2,
  Edit,
  ChefHat,
  Scan,
  Mic,
  Package,
  Sparkles,
  Check,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// --- Types ---
interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  price: number
  checked: boolean
  inPantry?: boolean
}

// --- Helper Data ---
const CATEGORIES = [
  { id: 'protein', name: 'Protein', icon: '🥩' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥦' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'grains', name: 'Grains', icon: '🍚' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'snacks', name: 'Snacks', icon: '🍿' },
  { id: 'other', name: 'Other', icon: '📦' }
]

const SUGGESTED_ITEMS = [
  'Eggs', 'Chicken Breast', 'Milk', 'Rice', 'Tomato', 'Onion', 'Spinach', 'Oats', 'Bread', 'Cheese', 'Fish', 'Apples'
]

const getIngredientIcon = (name: string, category?: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('egg')) return '🥚'
  if (lowerName.includes('chicken')) return '🍗'
  if (lowerName.includes('rice')) return '🍚'
  if (lowerName.includes('bread')) return '🍞'
  if (lowerName.includes('milk')) return '🥛'
  if (lowerName.includes('tomato')) return '🍅'
  if (lowerName.includes('onion')) return '🧅'
  if (lowerName.includes('spinach')) return '🥬'
  if (lowerName.includes('cheese')) return '🧀'
  if (lowerName.includes('fish')) return '🐟'
  return category?.includes('protein') ? '🥩' : category?.includes('vegetables') ? '🥬' : '📦'
}

// --- Component ---
export default function ShoppingList() {
  // --- State ---
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('shoppingList')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      { id: '1', name: 'Eggs', quantity: 12, unit: 'pcs', category: 'protein', price: 120, checked: false },
      { id: '2', name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'protein', price: 350, checked: false },
      { id: '3', name: 'Milk', quantity: 1, unit: 'L', category: 'dairy', price: 65, checked: true },
      { id: '4', name: 'Rice', quantity: 2, unit: 'kg', category: 'grains', price: 200, checked: false, inPantry: true },
      { id: '5', name: 'Tomato', quantity: 500, unit: 'g', category: 'vegetables', price: 40, checked: false },
      { id: '6', name: 'Onion', quantity: 1, unit: 'kg', category: 'vegetables', price: 30, checked: false, inPantry: true }
    ]
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('other')

  // --- Derived State ---
  const stats = useMemo(() => {
    const total = items.length
    const completed = items.filter(i => i.checked).length
    const remaining = total - completed
    const estimatedCost = items.filter(i => !i.checked).reduce((sum, i) => sum + i.price, 0)
    return { total, completed, remaining, estimatedCost }
  }, [items])

  const activeItems = useMemo(() => items.filter(i => !i.checked), [items])
  const completedItems = useMemo(() => items.filter(i => i.checked), [items])

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {}
    activeItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [activeItems])

  const filteredSuggestions = useMemo(() => 
    SUGGESTED_ITEMS.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
  [searchQuery])

  const pantryItems = useMemo(() => {
    const saved = localStorage.getItem('pantry')
    return saved ? JSON.parse(saved) : []
  }, [])

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(items))
  }, [items])

  // --- Handlers ---
  const toggleCheck = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const addItem = (item: Omit<ShoppingItem, 'id' | 'checked'>) => {
    // Check if already in pantry
    const inPantry = pantryItems.some((p: any) => p.name.toLowerCase().includes(item.name.toLowerCase()))
    setItems([...items, { ...item, id: Date.now().toString(), checked: false, inPantry }])
    setShowAddModal(false)
    setSearchQuery('')
  }

  const quickAddItem = (name: string) => {
    const category = CATEGORIES.find(c => 
      ['protein', 'dairy', 'grains', 'vegetables', 'fruits'].includes(c.id)
    )?.id || 'other'
    addItem({
      name,
      quantity: 1,
      unit: 'pcs',
      category,
      price: Math.floor(Math.random() * 100) + 20
    })
  }

  const clearAll = () => {
    if (confirm('Clear all items?')) {
      setItems([])
    }
  }

  // --- Render ---
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🛒 Shopping List</h1>
        <p className="text-gray-500">Smart grocery management for your kitchen</p>
      </div>

      {/* --- 1. Summary Cards --- */}
      <div className="flex gap-4 overflow-x-auto pb-6 mb-6 -mx-6 px-6">
        <StatCard icon="📦" label="Total Items" value={stats.total} color="green" />
        <StatCard icon="✅" label="Completed" value={stats.completed} color="blue" />
        <StatCard icon="🛍" label="Remaining" value={stats.remaining} color="orange" />
        <StatCard icon="💰" label="Est. Cost" value={`₹${stats.estimatedCost}`} color="purple" isText />
      </div>

      {/* --- 2. Shopping Progress --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-900">Shopping Progress</span>
          <span className="text-green-600 font-bold">{stats.completed} / {stats.total}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* --- 3. Smart Insights --- */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Smart Insights</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {items.some(i => i.inPantry) && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <span>You already have Rice and Onion in your Pantry!</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="mt-0.5">💡</span>
                <span>Eggs and Chicken are required for 3 planned meals this week.</span>
              </li>
              {stats.remaining > 0 && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <span>You can complete this week's meal plan with {stats.remaining} more items.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* --- 4. Smart Search & Add --- */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="What do you need to buy today?"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          />
          <button 
            onClick={() => setShowAddModal(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Quick Add
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && searchQuery && filteredSuggestions.length > 0 && (
          <div className="mt-3 p-2 border border-gray-100 rounded-xl bg-white">
            {filteredSuggestions.map(item => (
              <button
                key={item}
                onClick={() => quickAddItem(item)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-green-600" />
                {item}
              </button>
            ))}
          </div>
        )}

        {showSuggestions && !searchQuery && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-500 mb-2">Frequently Purchased</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ITEMS.slice(0, 6).map(item => (
                <button
                  key={item}
                  onClick={() => quickAddItem(item)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- 5. Main Shopping List --- */}
      {items.length > 0 ? (
        <div className="space-y-6">
          {/* Grouped Active Items */}
          {Object.entries(groupedItems).map(([categoryId, categoryItems]) => {
            const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
            return (
              <div key={categoryId}>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  {category.name}
                </h3>
                <div className="space-y-3">
                  {categoryItems.map(item => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onToggle={() => toggleCheck(item.id)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-500 mb-4">
                <CheckSquare className="w-5 h-5" />
                Purchased Items
              </h3>
              <div className="space-y-3 opacity-75">
                {completedItems.map(item => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => toggleCheck(item.id)}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={clearAll}
            className="w-full py-3 text-red-600 bg-red-50 rounded-xl font-medium hover:bg-red-100"
          >
            Clear All Items
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Your shopping list is empty</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Generate ingredients from recipes or meal plans to get started.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Generate Shopping List
          </button>
        </div>
      )}

      {/* --- Floating Action Button --- */}
      <div className="fixed bottom-24 right-6 z-50">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 mb-2 space-y-2">
            <button
              onClick={() => { setShowAddModal(true); setFabOpen(false) }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-700">Add Item</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <ChefHat className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-700">Import from Meal Plan</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Import from Recipes</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <Scan className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-700">Scan Barcode</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <Mic className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-gray-700">Voice Add</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            fabOpen ? 'bg-red-500 rotate-45' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={addItem}
        />
      )}
    </div>
  )
}

// --- Sub-components ---

function StatCard({ icon, label, value, color, isText = false }: { icon: string, label: string, value: number | string, color: string, isText?: boolean }) {
  const colors = {
    green: 'text-green-600 bg-green-50 border-green-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  }

  return (
    <div className={`flex-shrink-0 w-44 p-5 rounded-2xl border shadow-sm ${colors[color as keyof typeof colors]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${isText ? 'text-sm' : ''}`}>{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}

function ShoppingItemCard({ item, onToggle, onDelete }: { item: ShoppingItem, onToggle: () => void, onDelete: () => void }) {
  const category = CATEGORIES.find(c => c.id === item.category)
  const icon = getIngredientIcon(item.name, item.category)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-gray-50"
        >
          {item.checked ? (
            <CheckSquare className="w-6 h-6 text-green-600" />
          ) : (
            <Square className="w-6 h-6 text-gray-300" />
          )}
        </button>

        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold text-gray-900 ${item.checked ? 'line-through text-gray-400' : ''}`}>
              {item.name}
            </h4>
            <div className="flex items-center gap-2">
              {item.inPantry && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  In Pantry
                </span>
              )}
              <span className="font-bold text-green-700">₹{item.price}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-gray-500">
              {item.quantity} {item.unit}
            </span>
            {category && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {category.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AddItemModal({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (item: any) => void }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('pcs')
  const [category, setCategory] = useState('other')
  const [price, setPrice] = useState(50)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Shopping Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault()
          onAdd({ name, quantity, unit, category, price })
          setName('')
          setQuantity(1)
          setUnit('pcs')
          setCategory('other')
          setPrice(50)
        }} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eggs"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="pcs">pcs</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

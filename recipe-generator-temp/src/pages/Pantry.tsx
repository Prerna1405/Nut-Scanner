import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Edit,
  Package,
  AlertTriangle,
  Clock,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ShoppingCart,
  Scan,
  ChefHat,
  PlusCircle,
  Sparkles
} from 'lucide-react'

// --- Types ---
interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  lowStock: number
  expiryDate?: string
  purchaseDate?: string
}

type FilterStatus = 'all' | 'healthy' | 'low' | 'expiring' | 'expired'

// --- Helper Functions ---
const getExpiryStatus = (expiryDate?: string) => {
  if (!expiryDate) return { status: 'ok' as const, days: null }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { status: 'expired' as const, days: diffDays }
  if (diffDays <= 3) return { status: 'expiring' as const, days: diffDays }
  return { status: 'ok' as const, days: diffDays }
}

const getIngredientIcon = (name: string, category?: string) => {
  const lowerName = name.toLowerCase()
  const lowerCategory = category?.toLowerCase() || ''
  
  if (lowerName.includes('egg')) return '🥚'
  if (lowerName.includes('chicken') || lowerCategory.includes('meat')) return '🍗'
  if (lowerName.includes('rice')) return '🍚'
  if (lowerName.includes('bread')) return '🍞'
  if (lowerName.includes('milk') || lowerCategory.includes('dairy')) return '🥛'
  if (lowerName.includes('tomato')) return '🍅'
  if (lowerName.includes('cheese')) return '🧀'
  if (lowerCategory.includes('vegetable')) return '🥬'
  if (lowerCategory.includes('fruit')) return '🍎'
  if (lowerCategory.includes('seafood')) return '🐟'
  return '📦'
}

// --- Components ---
export default function Pantry() {
  // --- State ---
  const [items, setItems] = useState<PantryItem[]>(() => {
    const saved = localStorage.getItem('pantry')
    if (saved) {
      return JSON.parse(saved)
    }
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const inTwoDays = new Date()
    inTwoDays.setDate(inTwoDays.getDate() + 2)
    return [
      { id: '1', name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'Meat', lowStock: 200, expiryDate: tomorrow.toISOString().split('T')[0] },
      { id: '2', name: 'Brown Rice', quantity: 2, unit: 'kg', category: 'Grains', lowStock: 0.5, expiryDate: nextWeek.toISOString().split('T')[0] },
      { id: '3', name: 'Eggs', quantity: 6, unit: 'pcs', category: 'Dairy', lowStock: 4, expiryDate: inTwoDays.toISOString().split('T')[0] },
      { id: '4', name: 'Milk', quantity: 1, unit: 'L', category: 'Dairy', lowStock: 0.5 }
    ]
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  // --- Derived State ---
  const stats = useMemo(() => {
    let lowStock = 0, expiring = 0, expired = 0
    items.forEach(item => {
      if (item.quantity <= item.lowStock) lowStock++
      const expStatus = getExpiryStatus(item.expiryDate)
      if (expStatus.status === 'expiring') expiring++
      if (expStatus.status === 'expired') expired++
    })
    return { total: items.length, lowStock, expiring, expired }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      let matchesFilter = true
      const expStatus = getExpiryStatus(item.expiryDate)
      const isLow = item.quantity <= item.lowStock
      
      if (filterStatus === 'low') matchesFilter = isLow
      if (filterStatus === 'expiring') matchesFilter = expStatus.status === 'expiring'
      if (filterStatus === 'expired') matchesFilter = expStatus.status === 'expired'
      if (filterStatus === 'healthy') matchesFilter = !isLow && expStatus.status !== 'expiring' && expStatus.status !== 'expired'

      return matchesSearch && matchesFilter
    })
  }, [items, searchQuery, filterStatus])

  const lowStockItems = useMemo(() => items.filter(item => item.quantity <= item.lowStock), [items])
  const expiringItems = useMemo(() => items.filter(item => getExpiryStatus(item.expiryDate).status === 'expiring'), [items])
  const expiredItems = useMemo(() => items.filter(item => getExpiryStatus(item.expiryDate).status === 'expired'), [items])

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('pantry', JSON.stringify(items))
  }, [items])

  // --- Handlers ---
  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const addItem = (item: Omit<PantryItem, 'id'>) => {
    setItems([...items, { ...item, id: Date.now().toString() }])
    setShowAddModal(false)
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Pantry</h1>
        <p className="text-gray-500">Manage your ingredients and reduce waste</p>
      </div>

      {/* --- 1. Overview Cards --- */}
      <div className="flex gap-4 overflow-x-auto pb-6 mb-6 -mx-6 px-6">
        <StatCard
          icon="📦"
          label="Total Items"
          value={stats.total}
          color="green"
        />
        <StatCard
          icon="⚠️"
          label="Low Stock"
          value={stats.lowStock}
          color="orange"
        />
        <StatCard
          icon="⏰"
          label="Expiring Soon"
          value={stats.expiring}
          color="yellow"
        />
        <StatCard
          icon="❌"
          label="Expired"
          value={stats.expired}
          color="red"
        />
      </div>

      {/* --- 2. Search & Filter Bar --- */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-100">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'healthy', label: 'Healthy' },
            { id: 'low', label: 'Low Stock' },
            { id: 'expiring', label: 'Expiring Soon' },
            { id: 'expired', label: 'Expired' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id as FilterStatus)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === f.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- 3. Smart Insights --- */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">Smart Insights</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">💡</span>
                <span>You have ingredients for {Math.floor(items.length / 2)} recipes.</span>
              </li>
              {stats.lowStock > 0 && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <span>{lowStockItems[0]?.name} is running low. Consider restocking.</span>
                </li>
              )}
              {stats.expiring > 0 && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <span>{stats.expiring} items will expire within 3 days.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* --- 4. Low Stock Section --- */}
      {lowStockItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Low Stock Items
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm min-w-[200px]">
                <div className="text-3xl mb-2">{getIngredientIcon(item.name, item.category)}</div>
                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-500 mb-3">{item.quantity} {item.unit} remaining</p>
                <button className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 5. Expiry Center --- */}
      {(expiringItems.length > 0 || expiredItems.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            Expiry Center
          </h2>
          
          {expiringItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Expiring Soon</h3>
              <div className="space-y-3">
                {expiringItems.map(item => (
                  <div key={item.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getIngredientIcon(item.name, item.category)}</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-yellow-700">
                          Expires in {getExpiryStatus(item.expiryDate).days} days
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-yellow-100 rounded-lg text-gray-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiredItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Expired</h3>
              <div className="space-y-3">
                {expiredItems.map(item => (
                  <div key={item.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between opacity-90">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getIngredientIcon(item.name, item.category)}</div>
                      <div>
                        <h4 className="font-medium text-gray-900 line-through">{item.name}</h4>
                        <p className="text-sm text-red-700">
                          Expired {Math.abs(getExpiryStatus(item.expiryDate).days)} days ago
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- 6. Main Pantry List --- */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const expStatus = getExpiryStatus(item.expiryDate)
            const isLow = item.quantity <= item.lowStock
            
            let badgeColor = 'bg-green-100 text-green-700'
            let badgeText = 'Healthy Stock'
            if (expStatus.status === 'expired') { badgeColor = 'bg-red-100 text-red-700'; badgeText = 'Expired' }
            else if (expStatus.status === 'expiring') { badgeColor = 'bg-yellow-100 text-yellow-700'; badgeText = `Expires in ${expStatus.days}d` }
            else if (isLow) { badgeColor = 'bg-orange-100 text-orange-700'; badgeText = 'Low Stock' }

            return (
              <div 
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-3xl">
                    {getIngredientIcon(item.name, item.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                        {item.category && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">{item.quantity}</span>
                        <span className="text-gray-500 ml-1">{item.unit}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* --- Empty State --- */
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Your pantry is empty</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Start adding ingredients to generate personalized recipes and smart meal plans.
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Add First Ingredient
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
              <PlusCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-700">Add Item</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <Scan className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Scan Barcode</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <ChefHat className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-700">Generate Recipe</span>
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

      {/* --- Add Item Modal --- */}
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

// --- Sub-Components ---

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
  const colors = {
    green: 'text-green-600 bg-green-50 border-green-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    red: 'text-red-600 bg-red-50 border-red-100',
  }

  return (
    <div className={`flex-shrink-0 w-40 p-5 rounded-2xl border shadow-sm ${colors[color as keyof typeof colors]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}

function AddItemModal({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (item: any) => void }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('pcs')
  const [category, setCategory] = useState('')
  const [lowStock, setLowStock] = useState(1)
  const [expiryDate, setExpiryDate] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Pantry Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault()
          onAdd({ name, quantity, unit, category, lowStock, expiryDate: expiryDate || undefined })
          setName('')
          setQuantity(1)
          setUnit('pcs')
          setCategory('')
          setLowStock(1)
          setExpiryDate('')
        }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Breast"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select Category</option>
              <option value="Meat">Meat</option>
              <option value="Seafood">Seafood</option>
              <option value="Dairy">Dairy</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Threshold</label>
            <input
              type="number"
              value={lowStock}
              onChange={(e) => setLowStock(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
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

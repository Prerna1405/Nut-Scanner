import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePantry } from './usePantry';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price: number;
  checked: boolean;
  inPantry?: boolean;
}

const STORAGE_KEY = '@shopping_list_items';

export const CATEGORIES = [
  { id: 'protein', name: 'Protein', icon: '🥩' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥦' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'grains', name: 'Grains', icon: '🍚' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'snacks', name: 'Snacks', icon: '🍿' },
  { id: 'other', name: 'Other', icon: '📦' }
];

export const SUGGESTED_ITEMS = [
  'Eggs', 'Chicken Breast', 'Milk', 'Rice', 'Tomato', 'Onion', 'Spinach', 'Oats', 'Bread', 'Cheese', 'Fish', 'Apples'
];

export const getShoppingIngredientIcon = (name: string, category?: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('egg')) return '🥚';
  if (lowerName.includes('chicken')) return '🍗';
  if (lowerName.includes('rice')) return '🍚';
  if (lowerName.includes('bread')) return '🍞';
  if (lowerName.includes('milk')) return '🥛';
  if (lowerName.includes('tomato')) return '🍅';
  if (lowerName.includes('onion')) return '🧅';
  if (lowerName.includes('spinach')) return '🥬';
  if (lowerName.includes('cheese')) return '🧀';
  if (lowerName.includes('fish')) return '🐟';
  return category?.includes('protein') ? '🥩' : category?.includes('vegetables') ? '🥬' : '📦';
};

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { items: pantryItems } = usePantry();

  useEffect(() => {
    const loadItems = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          // Default mock data
          const defaultItems: ShoppingItem[] = [
            { id: '1', name: 'Eggs', quantity: 12, unit: 'pcs', category: 'protein', price: 120, checked: false },
            { id: '2', name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'protein', price: 350, checked: false },
            { id: '3', name: 'Milk', quantity: 1, unit: 'L', category: 'dairy', price: 65, checked: true },
            { id: '4', name: 'Rice', quantity: 2, unit: 'kg', category: 'grains', price: 200, checked: false, inPantry: true },
            { id: '5', name: 'Tomato', quantity: 500, unit: 'g', category: 'vegetables', price: 40, checked: false },
            { id: '6', name: 'Onion', quantity: 1, unit: 'kg', category: 'vegetables', price: 30, checked: false, inPantry: true }
          ];
          setItems(defaultItems);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
        }
      } catch (e) {
        console.error('Failed to load shopping list', e);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const saveItems = async (newItems: ShoppingItem[]) => {
    try {
      setItems(newItems);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save shopping list', e);
    }
  };

  const toggleCheck = async (id: string) => {
    const newItems = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    await saveItems(newItems);
  };

  const deleteItem = async (id: string) => {
    await saveItems(items.filter(i => i.id !== id));
  };

  const addItem = async (item: Omit<ShoppingItem, 'id' | 'checked'>) => {
    const inPantry = pantryItems.some((p: any) => p.name.toLowerCase().includes(item.name.toLowerCase()));
    const newItem = { ...item, id: Date.now().toString(), checked: false, inPantry };
    await saveItems([...items, newItem]);
  };

  const clearAll = async () => {
    await saveItems([]);
  };

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => i.checked).length;
    const remaining = total - completed;
    const estimatedCost = items.filter(i => !i.checked).reduce((sum, i) => sum + i.price, 0);
    return { total, completed, remaining, estimatedCost };
  }, [items]);

  const activeItems = useMemo(() => items.filter(i => !i.checked), [items]);
  const completedItems = useMemo(() => items.filter(i => i.checked), [items]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    activeItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [activeItems]);

  return {
    items,
    loading,
    stats,
    activeItems,
    completedItems,
    groupedItems,
    toggleCheck,
    deleteItem,
    addItem,
    clearAll
  };
}

import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStock: number;
  expiryDate?: string;
  purchaseDate?: string;
}

export type FilterStatus = 'all' | 'healthy' | 'low' | 'expiring' | 'expired';

const STORAGE_KEY = '@pantry_items';

export const getExpiryStatus = (expiryDate?: string) => {
  if (!expiryDate) return { status: 'ok' as const, days: null };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'expired' as const, days: diffDays };
  if (diffDays <= 3) return { status: 'expiring' as const, days: diffDays };
  return { status: 'ok' as const, days: diffDays };
};

export const getIngredientIcon = (name: string, category?: string) => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category?.toLowerCase() || '';
  
  if (lowerName.includes('egg')) return '🥚';
  if (lowerName.includes('chicken') || lowerCategory.includes('meat')) return '🍗';
  if (lowerName.includes('rice')) return '🍚';
  if (lowerName.includes('bread')) return '🍞';
  if (lowerName.includes('milk') || lowerCategory.includes('dairy')) return '🥛';
  if (lowerName.includes('tomato')) return '🍅';
  if (lowerName.includes('cheese')) return '🧀';
  if (lowerCategory.includes('vegetable')) return '🥬';
  if (lowerCategory.includes('fruit')) return '🍎';
  if (lowerCategory.includes('seafood')) return '🐟';
  return '📦';
};

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          // Default mock data if empty
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const inTwoDays = new Date();
          inTwoDays.setDate(inTwoDays.getDate() + 2);
          
          const defaultItems: PantryItem[] = [
            { id: '1', name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'Meat', lowStock: 200, expiryDate: tomorrow.toISOString().split('T')[0] },
            { id: '2', name: 'Brown Rice', quantity: 2, unit: 'kg', category: 'Grains', lowStock: 0.5, expiryDate: nextWeek.toISOString().split('T')[0] },
            { id: '3', name: 'Eggs', quantity: 6, unit: 'pcs', category: 'Dairy', lowStock: 4, expiryDate: inTwoDays.toISOString().split('T')[0] },
            { id: '4', name: 'Milk', quantity: 1, unit: 'L', category: 'Dairy', lowStock: 0.5 }
          ];
          setItems(defaultItems);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
        }
      } catch (e) {
        console.error('Failed to load pantry items', e);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  // Save to AsyncStorage whenever items change
  const saveItems = async (newItems: PantryItem[]) => {
    try {
      setItems(newItems);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save pantry items', e);
    }
  };

  const addItem = async (item: Omit<PantryItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    await saveItems([...items, newItem]);
  };

  const removeItem = async (id: string) => {
    await saveItems(items.filter(i => i.id !== id));
  };

  const stats = useMemo(() => {
    let lowStock = 0, expiring = 0, expired = 0;
    items.forEach(item => {
      if (item.quantity <= item.lowStock) lowStock++;
      const expStatus = getExpiryStatus(item.expiryDate);
      if (expStatus.status === 'expiring') expiring++;
      if (expStatus.status === 'expired') expired++;
    });
    return { total: items.length, lowStock, expiring, expired };
  }, [items]);

  const lowStockItems = useMemo(() => items.filter(item => item.quantity <= item.lowStock), [items]);
  const expiringItems = useMemo(() => items.filter(item => getExpiryStatus(item.expiryDate).status === 'expiring'), [items]);
  const expiredItems = useMemo(() => items.filter(item => getExpiryStatus(item.expiryDate).status === 'expired'), [items]);

  return {
    items,
    loading,
    stats,
    lowStockItems,
    expiringItems,
    expiredItems,
    addItem,
    removeItem
  };
}

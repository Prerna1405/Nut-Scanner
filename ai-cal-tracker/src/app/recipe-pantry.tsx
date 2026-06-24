import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, shadows } from '../constants/Colors';
import { usePantry, FilterStatus, getExpiryStatus, getIngredientIcon, PantryItem } from '../hooks/usePantry';

export default function PantryScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const {
    items,
    loading,
    stats,
    lowStockItems,
    expiringItems,
    expiredItems,
    addItem,
    removeItem
  } = usePantry();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filters: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'healthy', label: 'Healthy' },
    { id: 'low', label: 'Low Stock' },
    { id: 'expiring', label: 'Expiring Soon' },
    { id: 'expired', label: 'Expired' },
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    const expStatus = getExpiryStatus(item.expiryDate);
    const isLow = item.quantity <= item.lowStock;
    
    if (filterStatus === 'low') matchesFilter = isLow;
    if (filterStatus === 'expiring') matchesFilter = expStatus.status === 'expiring';
    if (filterStatus === 'expired') matchesFilter = expStatus.status === 'expired';
    if (filterStatus === 'healthy') matchesFilter = !isLow && expStatus.status !== 'expiring' && expStatus.status !== 'expired';

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Smart Pantry',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Pantry</Text>
          <Text style={styles.headerSubtitle}>Manage your ingredients and reduce waste</Text>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <StatCard icon="📦" label="Total Items" value={stats.total} color="green" />
          <StatCard icon="⚠️" label="Low Stock" value={stats.lowStock} color="orange" />
          <StatCard icon="⏰" label="Expiring" value={stats.expiring} color="yellow" />
          <StatCard icon="❌" label="Expired" value={stats.expired} color="red" />
        </ScrollView>

        {/* Search & Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ingredients..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilterStatus(f.id)}
                style={[styles.filterChip, filterStatus === f.id && styles.filterChipSelected]}
              >
                <Text style={[styles.filterText, filterStatus === f.id && styles.filterTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main List */}
        {filteredItems.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredItems.map(item => {
              const expStatus = getExpiryStatus(item.expiryDate);
              const isLow = item.quantity <= item.lowStock;
              
              let badgeColor = '#dcfce7';
              let badgeTextColor = '#15803d';
              let badgeText = 'Healthy Stock';

              if (expStatus.status === 'expired') {
                badgeColor = '#fee2e2'; badgeTextColor = '#b91c1c'; badgeText = 'Expired';
              } else if (expStatus.status === 'expiring') {
                badgeColor = '#fef3c7'; badgeTextColor = '#b45309'; badgeText = `Expires in ${expStatus.days}d`;
              } else if (isLow) {
                badgeColor = '#ffedd5'; badgeTextColor = '#c2410c'; badgeText = 'Low Stock';
              }

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemIconWrapper}>
                    <Text style={styles.itemIconText}>{getIngredientIcon(item.name, item.category)}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.category ? <Text style={styles.itemCategory}>{item.category}</Text> : null}
                    
                    <View style={styles.itemQuantityRow}>
                      <Text style={styles.itemQuantity}>{item.quantity}</Text>
                      <Text style={styles.itemUnit}>{item.unit}</Text>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                      <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badgeText}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Your pantry is empty</Text>
            <Text style={styles.emptyDesc}>Start adding ingredients to manage them.</Text>
            <TouchableOpacity style={styles.addFirstButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addFirstButtonText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <AddItemModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={addItem} 
        colors={colors}
      />
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
  const getColors = () => {
    switch(color) {
      case 'green': return { bg: '#f0fdf4', border: '#dcfce7', text: '#16a34a' };
      case 'orange': return { bg: '#fff7ed', border: '#ffedd5', text: '#ea580c' };
      case 'yellow': return { bg: '#fefce8', border: '#fef3c7', text: '#ca8a04' };
      case 'red': return { bg: '#fef2f2', border: '#fee2e2', text: '#dc2626' };
      default: return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563' };
    }
  };
  const theme = getColors();

  return (
    <View style={[{ backgroundColor: theme.bg, borderColor: theme.border }, stylesCard.card]}>
      <Text style={stylesCard.icon}>{icon}</Text>
      <Text style={[{ color: theme.text }, stylesCard.value]}>{value}</Text>
      <Text style={stylesCard.label}>{label}</Text>
    </View>
  );
}

const stylesCard = StyleSheet.create({
  card: {
    width: 140,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginRight: spacing.md,
  },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  value: { fontSize: 28, fontWeight: 'bold' },
  label: { fontSize: 13, color: '#4b5563', marginTop: 2 },
});

function AddItemModal({ isOpen, onClose, onAdd, colors }: any) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState('1');

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={stylesModal.overlay}
      >
        <View style={[stylesModal.content, { backgroundColor: colors.surface }]}>
          <View style={stylesModal.header}>
            <Text style={[stylesModal.title, { color: colors.textPrimary }]}>Add Pantry Item</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Item Name</Text>
            <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="e.g. Chicken Breast" placeholderTextColor={colors.textSecondary} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Quantity</Text>
                <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Unit (e.g. kg, L, pcs)</Text>
                <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={unit} onChangeText={setUnit} />
              </View>
            </View>

            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Category (e.g. Meat, Dairy)</Text>
            <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={category} onChangeText={setCategory} />

            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Low Stock Alert Threshold</Text>
            <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={lowStock} onChangeText={setLowStock} keyboardType="numeric" />

            <View style={stylesModal.actions}>
              <TouchableOpacity style={[stylesModal.btn, { backgroundColor: colors.background }]} onPress={onClose}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[stylesModal.btn, { backgroundColor: '#16a34a' }]} onPress={() => {
                if (name) {
                  onAdd({ name, quantity: Number(quantity)||0, unit, category, lowStock: Number(lowStock)||0 });
                  onClose();
                }
              }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const stylesModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  btn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
  },
  filterScroll: {
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  itemIconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemIconText: {
    fontSize: 26,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },
  itemQuantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  itemQuantity: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  itemUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  addFirstButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

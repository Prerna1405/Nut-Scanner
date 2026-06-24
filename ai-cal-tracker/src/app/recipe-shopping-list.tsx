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
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, shadows } from '../constants/Colors';
import { 
  useShoppingList, 
  CATEGORIES, 
  SUGGESTED_ITEMS, 
  getShoppingIngredientIcon,
  ShoppingItem
} from '../hooks/useShoppingList';

export default function ShoppingListScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const {
    items,
    loading,
    stats,
    completedItems,
    groupedItems,
    toggleCheck,
    deleteItem,
    addItem,
    clearAll
  } = useShoppingList();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = SUGGESTED_ITEMS.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleQuickAdd = (name: string) => {
    const category = CATEGORIES.find(c => 
      ['protein', 'dairy', 'grains', 'vegetables', 'fruits'].includes(c.id)
    )?.id || 'other';
    
    addItem({
      name,
      quantity: 1,
      unit: 'pcs',
      category,
      price: Math.floor(Math.random() * 100) + 20
    });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Shopping List",
      "Are you sure you want to delete all items?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", onPress: clearAll, style: "destructive" }
      ]
    );
  };

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
          title: 'Shopping List',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 Shopping List</Text>
          <Text style={styles.headerSubtitle}>Smart grocery management for your kitchen</Text>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <StatCard icon="📦" label="Total Items" value={stats.total} color="green" />
          <StatCard icon="✅" label="Completed" value={stats.completed} color="blue" />
          <StatCard icon="🛍️" label="Remaining" value={stats.remaining} color="orange" />
          <StatCard icon="💰" label="Est. Cost" value={`₹${stats.estimatedCost}`} color="purple" isText />
        </ScrollView>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Shopping Progress</Text>
            <Text style={styles.progressCount}>{stats.completed} / {stats.total}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }
              ]} 
            />
          </View>
        </View>

        {/* Quick Add Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="cart" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="What do you need to buy?"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.quickAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Suggestions */}
          {showSuggestions && searchQuery.length > 0 && filteredSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {filteredSuggestions.map(item => (
                <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => handleQuickAdd(item)}>
                  <Ionicons name="add" size={18} color="#16a34a" />
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showSuggestions && !searchQuery && (
            <View style={styles.quickChipsContainer}>
              <Text style={styles.quickChipsLabel}>Frequently Purchased</Text>
              <View style={styles.quickChipsWrapper}>
                {SUGGESTED_ITEMS.slice(0, 6).map(item => (
                  <TouchableOpacity key={item} style={styles.quickChip} onPress={() => handleQuickAdd(item)}>
                    <Text style={styles.quickChipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Main List */}
        {items.length > 0 ? (
          <View style={styles.listContainer}>
            {Object.entries(groupedItems).map(([categoryId, categoryItems]) => {
              const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <View key={categoryId} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.icon} {category.name}</Text>
                  <View style={styles.categoryList}>
                    {categoryItems.map(item => (
                      <ShoppingItemCard 
                        key={item.id} 
                        item={item} 
                        colors={colors}
                        onToggle={() => toggleCheck(item.id)} 
                        onDelete={() => deleteItem(item.id)} 
                      />
                    ))}
                  </View>
                </View>
              );
            })}

            {completedItems.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>✅ Purchased Items</Text>
                <View style={[styles.categoryList, { opacity: 0.6 }]}>
                  {completedItems.map(item => (
                    <ShoppingItemCard 
                      key={item.id} 
                      item={item} 
                      colors={colors}
                      onToggle={() => toggleCheck(item.id)} 
                      onDelete={() => deleteItem(item.id)} 
                    />
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All Items</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptyDesc}>Add items you need to buy for your meals.</Text>
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

function StatCard({ icon, label, value, color, isText = false }: any) {
  const getColors = () => {
    switch(color) {
      case 'green': return { bg: '#f0fdf4', border: '#dcfce7', text: '#16a34a' };
      case 'blue': return { bg: '#eff6ff', border: '#dbeafe', text: '#2563eb' };
      case 'orange': return { bg: '#fff7ed', border: '#ffedd5', text: '#ea580c' };
      case 'purple': return { bg: '#faf5ff', border: '#f3e8ff', text: '#9333ea' };
      default: return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563' };
    }
  };
  const theme = getColors();

  return (
    <View style={[{ backgroundColor: theme.bg, borderColor: theme.border }, stylesCard.card]}>
      <Text style={stylesCard.icon}>{icon}</Text>
      <Text style={[{ color: theme.text }, isText ? stylesCard.valueText : stylesCard.value]}>{value}</Text>
      <Text style={stylesCard.label}>{label}</Text>
    </View>
  );
}

const stylesCard = StyleSheet.create({
  card: { width: 140, padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, marginRight: spacing.md },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  value: { fontSize: 28, fontWeight: 'bold' },
  valueText: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 13, color: '#4b5563', marginTop: 2 },
});

function ShoppingItemCard({ item, colors, onToggle, onDelete }: any) {
  const icon = getShoppingIngredientIcon(item.name, item.category);

  return (
    <View style={[stylesItem.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity style={stylesItem.checkBtn} onPress={onToggle}>
        <Ionicons 
          name={item.checked ? "checkbox" : "square-outline"} 
          size={24} 
          color={item.checked ? "#16a34a" : colors.textSecondary} 
        />
      </TouchableOpacity>

      <View style={stylesItem.iconBox}>
        <Text style={stylesItem.icon}>{icon}</Text>
      </View>

      <View style={stylesItem.details}>
        <View style={stylesItem.headerRow}>
          <Text style={[stylesItem.name, { color: colors.textPrimary }, item.checked && stylesItem.nameChecked]}>
            {item.name}
          </Text>
          <Text style={stylesItem.price}>₹{item.price}</Text>
        </View>

        <View style={stylesItem.subRow}>
          <Text style={[stylesItem.qty, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit}
          </Text>
          {item.inPantry && (
            <View style={stylesItem.pantryBadge}>
              <Text style={stylesItem.pantryText}>In Pantry</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={stylesItem.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

const stylesItem = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.sm },
  checkBtn: { paddingRight: spacing.sm },
  iconBox: { width: 44, height: 44, backgroundColor: '#f9fafb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  icon: { fontSize: 24 },
  details: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  nameChecked: { textDecorationLine: 'line-through', color: '#9ca3af' },
  price: { fontSize: 15, fontWeight: 'bold', color: '#15803d' },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  qty: { fontSize: 14 },
  pantryBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pantryText: { color: '#1d4ed8', fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { padding: spacing.sm, marginLeft: spacing.sm },
});

function AddItemModal({ isOpen, onClose, onAdd, colors }: any) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('other');
  const [price, setPrice] = useState('50');

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={stylesModal.overlay}>
        <View style={[stylesModal.content, { backgroundColor: colors.surface }]}>
          <View style={stylesModal.header}>
            <Text style={[stylesModal.title, { color: colors.textPrimary }]}>Add Shopping Item</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Item Name</Text>
            <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="e.g. Eggs" placeholderTextColor={colors.textSecondary} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Quantity</Text>
                <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Unit</Text>
                <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={unit} onChangeText={setUnit} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Price (₹)</Text>
                <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={price} onChangeText={setPrice} keyboardType="numeric" />
              </View>
            </View>

            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Category</Text>
            <TextInput style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} value={category} onChangeText={setCategory} placeholder="e.g. protein, dairy, vegetables" placeholderTextColor={colors.textSecondary} />

            <View style={stylesModal.actions}>
              <TouchableOpacity style={[stylesModal.btn, { backgroundColor: colors.background }]} onPress={onClose}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[stylesModal.btn, { backgroundColor: '#16a34a' }]} onPress={() => {
                if (name) {
                  onAdd({ name, quantity: Number(quantity)||1, unit, category, price: Number(price)||0 });
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  header: { padding: spacing.xl, paddingBottom: spacing.lg },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  headerSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  statsScroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  progressContainer: { backgroundColor: colors.surface, marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, ...shadows.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressTitle: { fontWeight: '600', color: colors.textPrimary },
  progressCount: { fontWeight: 'bold', color: '#16a34a' },
  progressBarBg: { height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 6 },
  searchContainer: { backgroundColor: colors.surface, padding: spacing.md, marginHorizontal: spacing.xl, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, ...shadows.sm },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingLeft: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 48, color: colors.textPrimary },
  quickAddBtn: { backgroundColor: '#16a34a', height: 48, paddingHorizontal: 16, justifyContent: 'center', borderTopRightRadius: borderRadius.lg, borderBottomRightRadius: borderRadius.lg },
  quickAddBtnText: { color: '#fff', fontWeight: 'bold' },
  suggestionsContainer: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, backgroundColor: colors.surface },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  suggestionText: { marginLeft: 8, color: colors.textPrimary, fontSize: 15 },
  quickChipsContainer: { marginTop: spacing.md },
  quickChipsLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  quickChipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  quickChipText: { fontSize: 13, color: colors.textPrimary },
  listContainer: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  categorySection: { marginBottom: spacing.sm },
  categoryTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md },
  categoryList: { gap: spacing.sm },
  clearAllButton: { backgroundColor: '#fef2f2', padding: 16, borderRadius: borderRadius.xl, alignItems: 'center', marginTop: spacing.lg },
  clearAllText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60, marginHorizontal: spacing.xl, backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: colors.textSecondary },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', ...shadows.lg },
});

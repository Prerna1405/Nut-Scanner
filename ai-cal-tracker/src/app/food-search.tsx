import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { searchFoods, FatSecretFood } from "../services/fatsecretService";
import { addMealLog } from "../services/userService";
import { checkAndSyncReminders } from "../services/notificationService";
import { useToast } from "../components/Toast";

export default function FoodSearch() {
  const router = useRouter();
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FatSecretFood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Debounced search logic
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const foods = await searchFoods(trimmedQuery);
        setResults(foods);
        // Reset quantities when new results come in
        const newQuantities: Record<string, number> = {};
        foods.forEach(food => { newQuantities[food.id] = 1; });
        setQuantities(newQuantities);
      } catch (err) {
        console.error("Failed to search foods:", err);
      } finally {
        setIsLoading(false);
      }
    }, 450); // 450ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleAddFood = async (food: FatSecretFood, quantity: number) => {
    if (!userId) return;
    
    setIsSubmitting(food.id);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const scaledCalories = Math.round(food.calories * quantity);
      const scaledProtein = Number((food.protein * quantity).toFixed(1));
      const scaledFats = Number((food.fats * quantity).toFixed(1));
      const scaledCarbs = Number((food.carbs * quantity).toFixed(1));

      await addMealLog(userId, dateString, {
        name: `${food.name} (${quantity}x)`,
        calories: scaledCalories,
        protein: scaledProtein,
        fats: scaledFats,
        carbs: scaledCarbs,
        time: timeString,
      });

      // Mute notification reminders since user logged today's meal
      checkAndSyncReminders(userId);

      showToast(
        `Added "${food.name}" (${scaledCalories} kcal) to your daily log!`,
        "success"
      );
    } catch (error) {
      console.error(error);
      showToast("Could not log this food item. Please try again.", "error");
    } finally {
      setIsSubmitting(null);
    }
  };

  const renderFoodItem = ({ item }: { item: FatSecretFood }) => {
    const isAdding = isSubmitting === item.id;
    const quantity = quantities[item.id] || 1;

    const scaledCalories = Math.round(item.calories * quantity);
    const scaledProtein = Number((item.protein * quantity).toFixed(1));
    const scaledFats = Number((item.fats * quantity).toFixed(1));
    const scaledCarbs = Number((item.carbs * quantity).toFixed(1));

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.foodName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.foodDetails}>
            {item.servingSize} • <Text style={styles.calorieHighlight}>{scaledCalories} kcal</Text>
          </Text>
          <Text style={styles.macroDetails}>
            P: {scaledProtein}g • F: {scaledFats}g • C: {scaledCarbs}g
          </Text>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={() => {
              setQuantities(prev => ({
                ...prev,
                [item.id]: Math.max(1, (prev[item.id] || 1) - 1)
              }));
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={() => {
              setQuantities(prev => ({
                ...prev,
                [item.id]: (prev[item.id] || 1) + 1
              }));
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => handleAddFood(item, quantity)}
          disabled={isAdding}
          activeOpacity={0.7}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="add" size={24} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => { 
          Keyboard.dismiss(); 
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)'); // Navigate to home if no history
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Food</Text>
      </View>

      <View style={styles.content}>
        {/* Search Input Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search e.g. Banana, Chicken, Rice"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Area */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.infoText}>Searching food database...</Text>
          </View>
        ) : query.trim().length < 3 ? (
          <View style={styles.center}>
            <View style={styles.placeholderIconContainer}>
              <Ionicons name="search-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.placeholderTitle}>Discover Nutritional Data</Text>
            <Text style={styles.placeholderDesc}>
              Type at least 3 characters to search FatSecret's verified food database and quick-log your calories.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.placeholderIconContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={styles.placeholderTitle}>No Results Found</Text>
            <Text style={styles.placeholderDesc}>
              We couldn't find matches for "{query}". Try checking your spelling or typing another food.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderFoodItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs, marginRight: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  
  // Search Bar
  searchBarContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 52, marginVertical: spacing.md,
    ...shadows.sm,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  clearButton: { padding: 4 },

  // List Cards
  listContainer: { paddingBottom: 40 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg, marginVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  cardInfo: { flex: 1, marginRight: spacing.md },
  foodName: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary, marginBottom: 4 },
  foodDetails: { fontSize: 13, color: colors.textSecondary, marginBottom: 2, fontWeight: "500" },
  calorieHighlight: { color: colors.primary, fontWeight: "700" },
  macroDetails: { fontSize: 11, color: colors.textSecondary },
  
  // Quantity Controls
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(41,143,80,0.08)",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    height: 36,
    marginRight: spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    minWidth: 30,
    textAlign: "center",
  },
  
  addButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    justifyContent: "center", alignItems: "center", ...shadows.sm,
  },

  // Placeholders & Info
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
  infoText: { marginTop: spacing.md, fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  placeholderIconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(41, 143, 80, 0.06)",
    justifyContent: "center", alignItems: "center", marginBottom: spacing.md,
  },
  placeholderTitle: { fontSize: 17, fontWeight: "bold", color: colors.textPrimary, marginBottom: spacing.xs },
  placeholderDesc: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 18 },
});

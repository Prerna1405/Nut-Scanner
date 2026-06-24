import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows, borderRadius } from '../constants/Colors';
import { FavoriteRecipe } from '../types/recipe';
import { fetchFavorites, removeFavorite, addToHistory } from '../services/recipeService';

export default function FavoritesScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchFavorites(userId);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (favId: string) => {
    if (!userId) return;
    try {
      await removeFavorite(userId, favId);
      setFavorites(favorites.filter(f => f.id !== favId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleRecipePress = async (recipe: any) => {
    if (userId) {
      await addToHistory(userId, recipe);
    }
    router.push({
      pathname: '/recipe-details',
      params: { recipeId: recipe.id },
    });
  };

  const renderItem = ({ item }: { item: FavoriteRecipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      activeOpacity={0.8}
      onPress={() => handleRecipePress(item.recipe)}
    >
      <Image source={{ uri: item.recipe.imageUrl }} style={styles.recipeImage} contentFit="cover" />
      <View style={styles.recipeContent}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{item.recipe.title}</Text>
          <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)}>
            <Ionicons name="heart" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {item.recipe.description}
        </Text>
        <View style={styles.recipeMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="flame" size={14} color={colors.warning} />
            <Text style={styles.metaText}>{item.recipe.calories} kcal</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="restaurant" size={14} color="#FF6B6B" />
            <Text style={styles.metaText}>{item.recipe.protein}g</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.recipe.cookingTime}m</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={{ width: 40 }} />
      </View>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>Start adding recipes you love!</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  listContainer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  recipeContent: {
    padding: spacing.lg,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

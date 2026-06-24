import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { spacing, shadows, borderRadius } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { Recipe } from '../types/recipe';

export interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  horizontal?: boolean;
}

export function RecipeCard({ recipe, onPress, horizontal = false }: RecipeCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        horizontal ? styles.cardHorizontal : styles.cardVertical
      ]}
      activeOpacity={0.8}
      onPress={() => onPress(recipe)}
    >
      <Image 
        source={{ uri: recipe.imageUrl }} 
        style={[
          styles.image,
          horizontal ? styles.imageHorizontal : styles.imageVertical
        ]} 
        contentFit="cover" 
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={horizontal ? 1 : 2}>
          {recipe.title}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="flame" size={14} color={colors.warning} />
            <Text style={styles.metaText}>{recipe.calories} kcal</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="restaurant" size={14} color="#FF6B6B" />
            <Text style={styles.metaText}>{recipe.protein}g</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{recipe.cookingTime}m</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardVertical: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  cardHorizontal: {
    width: 240,
    marginRight: spacing.lg,
  },
  image: {
    width: '100%',
  },
  imageVertical: {
    height: 180,
  },
  imageHorizontal: {
    height: 140,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
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

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

export default function RecipeHubScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();

  const HUB_OPTIONS = [
    {
      title: 'AI Recipe Generator',
      description: 'Create personalized healthy recipes based on your exact macros and ingredients.',
      icon: 'sparkles' as const,
      color: '#16a34a',
      route: '/recipe-generator',
    },
    {
      title: 'Pantry Tracker',
      description: 'Manage your available ingredients to see what you can cook right now.',
      icon: 'cube-outline' as const,
      color: '#f59e0b',
      route: '/recipe-pantry',
    },
    {
      title: 'Meal Planner',
      description: 'Schedule your meals for the week to stay on track with your fitness goals.',
      icon: 'calendar-outline' as const,
      color: '#3b82f6',
      route: '/recipe-planner',
    },
    {
      title: 'Shopping List',
      description: 'Automatically generate and track grocery lists for your meal plans.',
      icon: 'cart-outline' as const,
      color: '#8b5cf6',
      route: '/recipe-shopping-list',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Recipe Hub',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Recipe Hub</Text>
        <Text style={styles.pageSubtitle}>Everything you need to plan, shop, and cook healthy meals.</Text>

        <View style={styles.grid}>
          {HUB_OPTIONS.map((option, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => router.push(option.route as any)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: `${option.color}15` }]}>
                <Ionicons name={option.icon} size={28} color={option.color} />
              </View>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardDesc}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  grid: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";

export default function LogExercise() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Exercise</Text>
      </View>

      <View style={styles.content}>
        {/* Option 1 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/workout-form", params: { type: "Cardio" } })}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "rgba(255, 107, 107, 0.1)" }]}>
            <Ionicons name="walk" size={28} color="#FF6B6B" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Run</Text>
            <Text style={styles.optionDesc}>Running, Walking, Cycling etc.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Option 2 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/workout-form", params: { type: "Weight Lifting" } })}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "rgba(77, 171, 247, 0.1)" }]}>
            <Ionicons name="barbell" size={28} color="#4DABF7" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Weight Lifting</Text>
            <Text style={styles.optionDesc}>Gym, Machines, Free Weights etc.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Option 3 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          activeOpacity={0.7}
          onPress={() => router.push("/workout-manual")}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "rgba(252, 196, 25, 0.1)" }]}>
            <Ionicons name="calculator" size={28} color="#FCC419" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Manual</Text>
            <Text style={styles.optionDesc}>Enter calories burned manually.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { addMealLog } from "../services/userService";

export default function ScanResult() {
  const router = useRouter();
  const { userId } = useAuth();
  const foodNameInputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{
    imageUri?: string;
    foodName?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    servingSize?: string;
  }>();

  const [foodName, setFoodName] = useState(params.foodName || "");
  const [calories, setCalories] = useState(params.calories || "0");
  const [protein, setProtein] = useState(params.protein || "0");
  const [carbs, setCarbs] = useState(params.carbs || "0");
  const [fat, setFat] = useState(params.fat || "0");
  const [servingSize, setServingSize] = useState(params.servingSize || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogMeal = async () => {
    if (!userId) {
      Alert.alert("Authentication Error", "You must be signed in to log food.");
      return;
    }

    if (!foodName.trim()) {
      Alert.alert("Missing Info", "Please enter a name for the food.");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await addMealLog(userId, dateString, {
        name: foodName.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fat) || 0,
        time: timeString,
      });

      Alert.alert(
        "Logged Successfully",
        `Added "${foodName}" (${calories} kcal) to your daily log!`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)" as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error("[ScanResult] Failed to log scanned meal:", error);
      Alert.alert("Logging Failed", "Could not save your meal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Keyboard.dismiss();
            router.replace("/(tabs)");
          }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Image Preview & Quick Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.imageWrapper}>
                {params.imageUri ? (
                  <Image source={{ uri: params.imageUri }} style={styles.foodImage} />
                ) : (
                  <View style={styles.fallbackIcon}>
                    <Ionicons name="restaurant-outline" size={32} color={colors.textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Gemini AI Estimation</Text>
                <View style={styles.titleRow}>
                  <Text style={styles.summaryTitle} numberOfLines={2}>
                    {foodName || "Unknown Dish"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => foodNameInputRef.current?.focus()}
                    style={styles.editIconButton}
                    accessibilityLabel="Edit food name"
                  >
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.summaryCalories}>{calories} kcal</Text>
              </View>
            </View>



            {/* Editable Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Verify Food Details</Text>

              {/* Food Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Food Name</Text>
                <TextInput
                  ref={foodNameInputRef}
                  style={styles.input}
                  placeholder="e.g. Grilled Chicken Salad"
                  placeholderTextColor={colors.textSecondary}
                  value={foodName}
                  onChangeText={setFoodName}
                />
              </View>

              {/* Serving Size */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Serving Size</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1 plate, 200g"
                  placeholderTextColor={colors.textSecondary}
                  value={servingSize}
                  onChangeText={setServingSize}
                />
              </View>

              {/* Calories */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>

              {/* Macros Grid */}
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Macros (grams)</Text>
              <View style={styles.macrosRow}>
                {/* Protein */}
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>

                {/* Carbs */}
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>

                {/* Fat */}
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Fats</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={fat}
                    onChangeText={setFat}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Save / Log CTA Footer */}
      <View style={styles.footer}>
        <AnimatedButton
          onPress={handleLogMeal}
          loading={isSubmitting}
          style={styles.logButton}
        >
          <Text style={styles.logButtonText}>Log to Daily Tracker</Text>
        </AnimatedButton>
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
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBg,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fallbackIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  summaryInfo: {
    flex: 1,
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryCalories: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: "center",
  },
  macroInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    height: 44,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logButton: {
    width: "100%",
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  editIconButton: { marginLeft: spacing.sm },
  logButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

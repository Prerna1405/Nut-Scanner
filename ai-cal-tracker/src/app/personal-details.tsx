import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getUserFitnessPlan, updateFullNutritionGoals, getUserProfileData, calculateNutritionGoals, updateUserProfile, OnboardingData } from "../services/userService";
import { AnimatedButton } from "../components/AnimatedButton";
import { borderRadius, spacing, shadows } from "../constants/Colors";

export default function PersonalDetailsScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Personal Data States
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [workoutFrequency, setWorkoutFrequency] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");

  // Goals States
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [water, setWater] = useState("");

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);

  // Parse height string like "5'8\"" into feet and inches
  const parseHeight = (heightStr: string) => {
    const match = heightStr.match(/(\d+)'(\d+)"/);
    if (match) {
      return { feet: match[1], inches: match[2] };
    }
    return { feet: "5", inches: "8" }; // Default
  };

  // Parse birthdate string like "1990-05-20" into day, month, year
  const parseBirthdate = (birthdateStr: string) => {
    const match = birthdateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { year: match[1], month: match[2], day: match[3] };
    }
    const year = new Date().getFullYear() - 30;
    return { year: year.toString(), month: "01", day: "01" }; // Default
  };

  // Build onboarding data object from current state
  const getCurrentOnboardingData = (): OnboardingData => {
    const bDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;
    return {
      gender,
      goal,
      workoutFrequency,
      birthdate: bDate,
      height: `${heightFeet}'${heightInches}"`,
      weight: parseFloat(weight) || 70,
    };
  };

  // Calculate goals based on current personal data
  const calculateGoalsFromCurrentData = () => {
    try {
      const onboardingData = getCurrentOnboardingData();
      const calculatedGoals = calculateNutritionGoals(onboardingData);
      setCalories(calculatedGoals.calories.toString());
      setProtein(calculatedGoals.protein.toString());
      setCarbs(calculatedGoals.carbs.toString());
      setFats(calculatedGoals.fats.toString());
      setWater(calculatedGoals.waterIntakeLiters.toString());
    } catch (err) {
      console.error("Error calculating goals:", err);
    }
  };

  const loadData = async () => {
    if (!userId) return;
    try {
      const profileData = await getUserProfileData(userId);
      const plan = await getUserFitnessPlan(userId);

      if (profileData) {
        setGender(profileData.gender);
        setGoal(profileData.goal);
        setWorkoutFrequency(profileData.workoutFrequency);
        
        const birthdateParsed = parseBirthdate(profileData.birthdate);
        setBirthYear(birthdateParsed.year);
        setBirthMonth(birthdateParsed.month);
        setBirthDay(birthdateParsed.day);
        
        const heightParsed = parseHeight(profileData.height);
        setHeightFeet(heightParsed.feet);
        setHeightInches(heightParsed.inches);
        
        setWeight(profileData.weight.toString());
      }

      if (plan && plan.dailyCalories) {
        setCalories((plan.dailyCalories || 2200).toString());
        setProtein((plan.macros?.protein || plan.proteinGrams || 130).toString());
        setCarbs((plan.macros?.carbs || plan.carbsGrams || 250).toString());
        setFats((plan.macros?.fats || plan.fatsGrams || 70).toString());
        
        const waterGoal = plan.waterIntakeLiters || plan.waterIntake || 3.0;
        const waterLiters = waterGoal > 15 ? waterGoal / 1000 : waterGoal;
        setWater(waterLiters.toString());
      } else if (profileData) {
        calculateGoalsFromCurrentData();
      } else {
        // Fallback to defaults
        setCalories("2200");
        setProtein("130");
        setCarbs("250");
        setFats("70");
        setWater("3.0");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setGeneralError("Failed to load personal details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Recalculate goals when personal data changes
  useEffect(() => {
    if (!loading && gender && goal && workoutFrequency && birthDay && birthMonth && birthYear && heightFeet && heightInches && weight) {
      calculateGoalsFromCurrentData();
    }
  }, [gender, goal, workoutFrequency, birthDay, birthMonth, birthYear, heightFeet, heightInches, weight, loading]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    try {
      const onboardingData = getCurrentOnboardingData();
      await updateUserProfile(userId, onboardingData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setGeneralError("Failed to save personal details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    setGeneralError("");
    setSuccess(false);

    const calNum = Number(calories);
    if (!calories || isNaN(calNum) || calNum < 500 || calNum > 10000) {
      newErrors.calories = "Enter calories between 500 and 10,000 kcal.";
    }

    const protNum = Number(protein);
    if (!protein || isNaN(protNum) || protNum < 10 || protNum > 500) {
      newErrors.protein = "Enter protein between 10 and 500g.";
    }

    const carbsNum = Number(carbs);
    if (!carbs || isNaN(carbsNum) || carbsNum < 10 || carbsNum > 1000) {
      newErrors.carbs = "Enter carbs between 10 and 1,000g.";
    }

    const fatsNum = Number(fats);
    if (!fats || isNaN(fatsNum) || fatsNum < 10 || fatsNum > 300) {
      newErrors.fats = "Enter fats between 10 and 300g.";
    }

    const waterNum = Number(water);
    if (!water || isNaN(waterNum) || waterNum < 0.5 || waterNum > 15.0) {
      newErrors.water = "Enter water goal between 0.5 and 15.0 Liters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!validate()) return;

    setSaving(true);
    try {
      await updateFullNutritionGoals(userId, {
        calories: Math.round(Number(calories)),
        protein: Math.round(Number(protein)),
        carbs: Math.round(Number(carbs)),
        fats: Math.round(Number(fats)),
        waterIntakeLiters: Number(water),
      });
      setSuccess(true);
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    } catch (err) {
      console.error("Error saving goals:", err);
      setGeneralError("Failed to update goals in the database. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading nutrition goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Personal Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Personal Details</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              Update your personal information to automatically calculate your nutrition goals.
            </Text>
          </View>

          {/* Personal Data Section */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Gender */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="person" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Gender</Text>
              </View>
              <View style={styles.optionsRow}>
                {[
                  { id: "male", label: "Male" },
                  { id: "female", label: "Female" },
                  { id: "non-binary", label: "Non-Binary" },
                  { id: "prefer-not-to-say", label: "Prefer not to say" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionChip,
                      gender === option.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setGender(option.id)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        gender === option.id && { color: "white" }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Goal */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="flag" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Fitness Goal</Text>
              </View>
              <View style={styles.optionsRow}>
                {[
                  { id: "lose-weight", label: "Lose Weight" },
                  { id: "maintain-weight", label: "Maintain" },
                  { id: "gain-weight", label: "Gain Weight" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionChip,
                      goal === option.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setGoal(option.id)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        goal === option.id && { color: "white" }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Workout Frequency */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="fitness" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Activity Level</Text>
              </View>
              <View style={styles.optionsRow}>
                {[
                  { id: "2-3-days", label: "2-3 days/week" },
                  { id: "3-4-days", label: "3-4 days/week" },
                  { id: "5-6-days", label: "5-6 days/week" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionChip,
                      workoutFrequency === option.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setWorkoutFrequency(option.id)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        workoutFrequency === option.id && { color: "white" }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Birthdate */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="calendar" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Birthdate</Text>
              </View>
              <View style={styles.birthdateRow}>
                <View style={styles.inputWrapperSmall}>
                  <TextInput
                    value={birthMonth}
                    onChangeText={setBirthMonth}
                    placeholder="MM"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
                <View style={styles.inputWrapperSmall}>
                  <TextInput
                    value={birthDay}
                    onChangeText={setBirthDay}
                    placeholder="DD"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
                <View style={styles.inputWrapperMedium}>
                  <TextInput
                    value={birthYear}
                    onChangeText={setBirthYear}
                    placeholder="YYYY"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>
            </View>

            {/* Height */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="resize" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Height</Text>
              </View>
              <View style={styles.heightRow}>
                <View style={styles.inputWrapperSmall}>
                  <TextInput
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    placeholder="ft"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>ft</Text>
                </View>
                <View style={styles.inputWrapperSmall}>
                  <TextInput
                    value={heightInches}
                    onChangeText={setHeightInches}
                    placeholder="in"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>in</Text>
                </View>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="scale" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Weight</Text>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>kg</Text>
              </View>
            </View>

            <AnimatedButton
              variant="outline"
              onPress={handleSaveProfile}
              loading={savingProfile}
              style={styles.saveProfileButton}
            >
              <Text style={[styles.saveProfileButtonText, { color: colors.primary }]}>Save Personal Details</Text>
            </AnimatedButton>
          </View>

          {/* Goals Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nutrition Goals</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Calculated automatically based on your personal details
            </Text>
          </View>

          {generalError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.successBannerText}>Goals saved successfully! Redirecting...</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Calories Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="flame" size={18} color="#FF6B6B" style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Daily Calories Budget</Text>
              </View>
              <View style={[styles.inputWrapper, errors.calories && styles.inputWrapperError, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="e.g. 2000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>kcal</Text>
              </View>
              {errors.calories ? <Text style={styles.errorText}>{errors.calories}</Text> : null}
            </View>

            {/* Protein Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="restaurant" size={18} color="#298F50" style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Protein Target</Text>
              </View>
              <View style={[styles.inputWrapper, errors.protein && styles.inputWrapperError, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="e.g. 130"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>grams</Text>
              </View>
              {errors.protein ? <Text style={styles.errorText}>{errors.protein}</Text> : null}
            </View>

            {/* Carbs Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="leaf" size={18} color="#4DABF7" style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Carbs Target</Text>
              </View>
              <View style={[styles.inputWrapper, errors.carbs && styles.inputWrapperError, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="e.g. 250"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>grams</Text>
              </View>
              {errors.carbs ? <Text style={styles.errorText}>{errors.carbs}</Text> : null}
            </View>

            {/* Fats Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="water" size={18} color="#FCC419" style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Fat Target</Text>
              </View>
              <View style={[styles.inputWrapper, errors.fats && styles.inputWrapperError, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={fats}
                  onChangeText={setFats}
                  placeholder="e.g. 70"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>grams</Text>
              </View>
              {errors.fats ? <Text style={styles.errorText}>{errors.fats}</Text> : null}
            </View>

            {/* Water Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="water" size={18} color="#0EA5E9" style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Water Consumption Goal</Text>
              </View>
              <View style={[styles.inputWrapper, errors.water && styles.inputWrapperError, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={water}
                  onChangeText={setWater}
                  placeholder="e.g. 3.0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
                <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>Liters</Text>
              </View>
              {errors.water ? <Text style={styles.errorText}>{errors.water}</Text> : null}
            </View>
          </View>

          {/* Action Button */}
          <AnimatedButton
            variant="primary"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </AnimatedButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    color: "#EF4444",
    fontSize: 13,
    marginLeft: spacing.sm,
    flex: 1,
    fontWeight: "500",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successBannerText: {
    color: "#22C55E",
    fontSize: 13,
    marginLeft: spacing.sm,
    flex: 1,
    fontWeight: "500",
  },
  formCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  birthdateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heightRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  inputWrapperSmall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.md,
  },
  inputWrapperMedium: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.md,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    height: "100%",
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  saveProfileButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveProfileButtonText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  saveButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

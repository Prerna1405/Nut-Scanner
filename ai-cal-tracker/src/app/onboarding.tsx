import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HugeiconsIcon } from "@hugeicons/react-native";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/Dumbbell01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import RulerIcon from "@hugeicons/core-free-icons/RulerIcon";
import WeightScaleIcon from "@hugeicons/core-free-icons/WeightScaleIcon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { colors, borderRadius, spacing, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { updateUserProfile } from "../services/userService";

export default function Onboarding() {
  const { userId } = useAuth();
  const router = useRouter();

  // Onboarding Step State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Gender
  const [gender, setGender] = useState("");

  // Step 2: Goal
  const [goal, setGoal] = useState("");

  // Step 3: Workout Frequency
  const [workoutFrequency, setWorkoutFrequency] = useState("");

  // Step 4: Birthdate
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // Step 5: Height & Weight
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");

  const handleNext = () => {
    setErrorMessage("");
    if (step === 1 && !gender) {
      setErrorMessage("Please select a gender option.");
      return;
    }
    if (step === 2 && !goal) {
      setErrorMessage("Please select a fitness goal.");
      return;
    }
    if (step === 3 && !workoutFrequency) {
      setErrorMessage("Please select a workout detail.");
      return;
    }
    if (step === 4) {
      const dayNum = parseInt(birthDay);
      const monthNum = parseInt(birthMonth);
      const yearNum = parseInt(birthYear);
      if (!birthDay || !birthMonth || !birthYear) {
        setErrorMessage("Please complete all birthdate fields.");
        return;
      }
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        setErrorMessage("Please enter a valid day (1-31).");
        return;
      }
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        setErrorMessage("Please enter a valid month (1-12).");
        return;
      }
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1920 || yearNum > currentYear) {
        setErrorMessage(`Please enter a valid year (1920-${currentYear}).`);
        return;
      }
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!userId) {
      setErrorMessage("User authentication missing. Please log in again.");
      return;
    }
    const weightNum = parseFloat(weight);
    if (!heightFeet || !heightInches || !weight) {
      setErrorMessage("Please fill in height and weight.");
      return;
    }
    if (isNaN(weightNum) || weightNum <= 10 || weightNum > 300) {
      setErrorMessage("Please enter a valid weight in Kg (10-300).");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const bDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;
      const onboardingData = {
        gender,
        goal,
        workoutFrequency,
        birthdate: bDate,
        height: `${heightFeet}'${heightInches}"`,
        weight: weightNum,
      };

      // 1. Save data locally to AsyncStorage
      await AsyncStorage.setItem(`onboarding_data_${userId}`, JSON.stringify(onboardingData));
      await AsyncStorage.setItem(`onboarding_${userId}`, "true");

      // 2. Save profile updates to Firebase Firestore
      await updateUserProfile(userId, onboardingData);

      // 3. Navigation to AI Plan Generation Screen
      router.push("/generate-plan");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (step / 5) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Progress Bar Header */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {step} of 5</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Step 1: Gender */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Gender</Text>
              <Text style={styles.stepSubtitle}>
                Please choose your biological sex for accurate calorie formulations.
              </Text>
              <View style={styles.optionsContainer}>
                {[
                  { id: "male", label: "Male" },
                  { id: "female", label: "Female" },
                  { id: "non-binary", label: "Non-Binary" },
                  { id: "prefer-not-to-say", label: "Prefer not to say" },
                ].map((item) => {
                  const isSelected = gender === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setGender(item.id)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                    >
                      <HugeiconsIcon
                        icon={UserIcon}
                        size={24}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.optionCardText,
                          isSelected && styles.optionCardTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What is your primary goal?</Text>
              <Text style={styles.stepSubtitle}>
                We will configure your calorie budget based on this target.
              </Text>
              <View style={styles.optionsContainer}>
                {[
                  { id: "lose-weight", label: "Lose Weight" },
                  { id: "gain-weight", label: "Gain Weight" },
                  { id: "maintain-weight", label: "Maintain Weight" },
                ].map((item) => {
                  const isSelected = goal === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setGoal(item.id)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                    >
                      <HugeiconsIcon
                        icon={Target01Icon}
                        size={24}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.optionCardText,
                          isSelected && styles.optionCardTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 3: Workout details */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>How active are you?</Text>
              <Text style={styles.stepSubtitle}>
                Select your average weekly exercise frequency.
              </Text>
              <View style={styles.optionsContainer}>
                {[
                  { id: "2-3-days", label: "2-3 Days / week" },
                  { id: "3-4-days", label: "3-4 Days / week" },
                  { id: "5-6-days", label: "5-6 Days / week" },
                ].map((item) => {
                  const isSelected = workoutFrequency === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setWorkoutFrequency(item.id)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                    >
                      <HugeiconsIcon
                        icon={Dumbbell01Icon}
                        size={24}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.optionCardText,
                          isSelected && styles.optionCardTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 4: Birthdate */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>When were you born?</Text>
              <Text style={styles.stepSubtitle}>
                Your age affects metabolic baseline calculations.
              </Text>

              <View style={styles.birthdateIconContainer}>
                <HugeiconsIcon icon={Calendar01Icon} size={40} color={colors.primary} />
              </View>

              <View style={styles.birthdateRow}>
                {/* Day */}
                <View style={styles.inputWrapperHalf}>
                  <Text style={styles.inputLabel}>Day</Text>
                  <TextInput
                    value={birthDay}
                    onChangeText={setBirthDay}
                    placeholder="DD"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.numericInput}
                  />
                </View>

                {/* Month */}
                <View style={styles.inputWrapperHalf}>
                  <Text style={styles.inputLabel}>Month</Text>
                  <TextInput
                    value={birthMonth}
                    onChangeText={setBirthMonth}
                    placeholder="MM"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.numericInput}
                  />
                </View>

                {/* Year */}
                <View style={styles.inputWrapperHalf}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    value={birthYear}
                    onChangeText={setBirthYear}
                    placeholder="YYYY"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={styles.numericInput}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Step 5: Height & Weight */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Body Metrics</Text>
              <Text style={styles.stepSubtitle}>
                Enter your physical parameters to compute BMI and metabolic benchmarks.
              </Text>

              {/* Height Row */}
              <View style={styles.metricsHeader}>
                <HugeiconsIcon icon={RulerIcon} size={22} color={colors.primary} />
                <Text style={styles.metricsLabel}>Height</Text>
              </View>
              <View style={styles.heightRow}>
                <View style={styles.inputWrapperHalf}>
                  <Text style={styles.inputLabel}>Feet</Text>
                  <TextInput
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    placeholder="e.g. 5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={styles.numericInput}
                  />
                </View>
                <View style={styles.inputWrapperHalf}>
                  <Text style={styles.inputLabel}>Inches</Text>
                  <TextInput
                    value={heightInches}
                    onChangeText={setHeightInches}
                    placeholder="e.g. 8"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.numericInput}
                  />
                </View>
              </View>

              {/* Weight Row */}
              <View style={[styles.metricsHeader, { marginTop: spacing.xl }]}>
                <HugeiconsIcon icon={WeightScaleIcon} size={22} color={colors.primary} />
                <Text style={styles.metricsLabel}>Weight (in Kg)</Text>
              </View>
              <View style={styles.singleWrapper}>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 70"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  style={styles.numericInput}
                />
              </View>
            </View>
          )}

          {/* Action Footer Navigation */}
          <View style={styles.footer}>
            {step > 1 ? (
              <AnimatedButton
                variant="outline"
                onPress={handleBack}
                style={styles.backBtn}
                disabled={isLoading}
              >
                <View style={styles.btnContent}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={colors.textPrimary} />
                  <Text style={styles.backBtnText}>Back</Text>
                </View>
              </AnimatedButton>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <AnimatedButton
              variant="primary"
              onPress={handleNext}
              loading={isLoading}
              style={styles.nextBtn}
            >
              <View style={styles.btnContent}>
                <Text style={styles.nextBtnText}>
                  {step === 5 ? "Complete" : "Next"}
                </Text>
                {step < 5 && (
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.white} />
                )}
                {step === 5 && (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color={colors.white} />
                )}
              </View>
            </AnimatedButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  progressContainer: {
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
  },
  stepContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    flex: 1,
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    width: "100%",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(41, 143, 80, 0.05)",
  },
  optionCardText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  optionCardTextSelected: {
    color: colors.primary,
  },
  birthdateIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(41, 143, 80, 0.05)",
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  birthdateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputWrapperHalf: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  numericInput: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 52,
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  metricsLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  heightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  singleWrapper: {
    width: "100%",
    paddingHorizontal: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  backBtn: {
    flex: 1,
    marginRight: spacing.sm,
    borderColor: colors.border,
  },
  backBtnText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },
  nextBtn: {
    flex: 1.5,
    marginLeft: spacing.sm,
  },
  nextBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: spacing.xs,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});

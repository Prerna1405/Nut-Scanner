// @ts-nocheck
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HugeiconsIcon } from "@hugeicons/react-native";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";

import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { generateFitnessPlan, OnboardingData, FitnessPlan } from "../services/aiService";
import { saveFitnessPlan } from "../services/userService";

const loadingSteps = [
  "Analyzing your body metrics",
  "Consulting the AI for optimal macros",
  "Calculating daily caloric needs",
  "Building your custom fitness plan",
  "Finalizing recommendations"
];

export default function GeneratePlanScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAiDone, setIsAiDone] = useState(false);

  useEffect(() => {
    // Advance the dummy timer every 1.5 seconds, but stop at the last step
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function processAIPlan() {
      if (!userId) {
        setError("User authentication missing.");
        return;
      }

      try {
        const dataStr = await AsyncStorage.getItem(`onboarding_data_${userId}`);
        if (!dataStr) {
          throw new Error("Missing onboarding data.");
        }

        const onboardingData: OnboardingData = JSON.parse(dataStr);

        // Generate plan via Gemini AI
        const aiPlan: FitnessPlan = await generateFitnessPlan(onboardingData);

        // Save the plan to Firebase
        await saveFitnessPlan(userId, aiPlan);

        // Save the plan to AsyncStorage for quick access
        await AsyncStorage.setItem(`fitness_plan_${userId}`, JSON.stringify(aiPlan));

        setIsAiDone(true);
        
        // Short delay to let the user see the final state, then navigate
        setTimeout(() => {
           router.replace("/(tabs)");
        }, 800);
      } catch (err: any) {
        console.error("Failed to generate plan:", err);
        setError(err.message || "Failed to generate your plan. Please try again.");
      }
    }

    processAIPlan();
  }, [userId, router]);

  // If AI finishes before dummy timer reaches the end, we can force step to max
  useEffect(() => {
    if (isAiDone) {
      setCurrentStep(loadingSteps.length);
    }
  }, [isAiDone]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={SparklesIcon} size={48} color={colors.white} />
            </View>
            
            <Text style={styles.title}>Creating Your Plan</Text>
            
            <View style={styles.stepsContainer}>
              {loadingSteps.map((stepText, index) => {
                const isCompleted = currentStep > index;
                const isActive = currentStep === index;
                const isPending = currentStep < index;

                return (
                  <View key={index} style={[styles.stepRow, isActive && styles.stepRowActive]}>
                    <View style={styles.stepIndicator}>
                      {isCompleted ? (
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} color={colors.success} />
                      ) : isActive ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View style={styles.pendingCircle} />
                      )}
                    </View>
                    <Text 
                      style={[
                        styles.stepText, 
                        isCompleted && styles.stepTextCompleted,
                        isActive && styles.stepTextActive,
                        isPending && styles.stepTextPending
                      ]}
                    >
                      {stepText}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.xl,
    width: "100%",
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
  stepsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  stepRowActive: {
    transform: [{ scale: 1.02 }],
  },
  stepIndicator: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  pendingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  stepText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  stepTextCompleted: {
    color: colors.textPrimary,
  },
  stepTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  stepTextPending: {
    color: colors.textSecondary,
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  }
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { analyzeFoodImage, FoodAnalysisResult } from "../services/aiService";

export default function ScanAnalysis() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [aiResult, setAiResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUri) {
      setError("No food image was provided. Please try again.");
      return;
    }

    let isMounted = true;
    let apiFinished = false;
    let resultData: FoodAnalysisResult | null = null;
    let apiErrorMsg: string | null = null;

    // Trigger Gemini AI Call
    analyzeFoodImage(imageUri)
      .then((res) => {
        if (!isMounted) return;
        resultData = res;
        apiFinished = true;
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Analysis API failed:", err);
        apiErrorMsg = err.message || "Could not analyze the food image. Make sure it is clear and check your connection.";
        apiFinished = true; // Still mark as finished to let steps resolve to error
      });

    // Step progression timer (1.5 seconds minimum per step to simulate analysis rhythm)
    const interval = setInterval(() => {
      if (!isMounted) return;

      setActiveStep((current) => {
        if (current === 0) {
          // Transition "Analyzing Food" -> "Getting Nutrition Data"
          return 1;
        }
        if (current === 1) {
          // Stay on "Getting Nutrition Data" until API call is finished
          if (apiFinished) {
            if (apiErrorMsg) {
              setError(apiErrorMsg);
              clearInterval(interval);
              return current;
            }
            if (resultData) {
              setAiResult(resultData);
              return 2; // Transition to "Preparing Final Results"
            }
          }
          return 1;
        }
        if (current === 2) {
          // Transition "Preparing Final Results" -> Complete
          clearInterval(interval);
          return 3;
        }
        return current;
      });
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [imageUri]);

  const steps = [
    { title: "Analyzing Food", id: 0 },
    { title: "Getting Nutrition Data", id: 1 },
    { title: "Preparing Final Results", id: 2 },
  ];

  const handleContinue = () => {
    if (!aiResult) return;
    router.push({
      pathname: "/scan-result",
      params: {
        imageUri,
        foodName: aiResult.foodName,
        calories: String(aiResult.calories),
        protein: String(aiResult.protein),
        carbs: String(aiResult.carbs),
        fat: String(aiResult.fat),
        servingSize: aiResult.servingSize,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)")}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyzing Food</Text>
      </View>

      <View style={styles.content}>
        {/* Square Image Preview Container */}
        <View style={styles.previewCard}>
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.fallbackContainer}>
                <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.fallbackText}>No Image Selected</Text>
              </View>
            )}
          </View>
        </View>

        {/* Steps Progress Card or Error State */}
        {error ? (
          <View style={[styles.stepsCard, styles.errorCard]}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={28} color={colors.error} />
              <Text style={styles.errorTitle}>Analysis Failed</Text>
            </View>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.7}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.retryButtonText}>Go Back & Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsCardTitle}>Analysis Progress</Text>
            
            <View style={styles.stepsList}>
              {steps.map((step) => {
                const isCompleted = step.id < activeStep;
                const isLoading = step.id === activeStep;
                const isPending = step.id > activeStep;

                return (
                  <View key={step.id} style={styles.stepItem}>
                    <View style={styles.indicatorWrapper}>
                      {isCompleted ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary}
                        />
                      ) : isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={24}
                          color={colors.border}
                        />
                      )}
                    </View>
                    
                    <Text
                      style={[
                        styles.stepText,
                        isCompleted && styles.stepTextCompleted,
                        isLoading && styles.stepTextLoading,
                        isPending && styles.stepTextPending,
                      ]}
                    >
                      {step.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Continue Button Section */}
      <View style={styles.footer}>
        <AnimatedButton
          onPress={handleContinue}
          disabled={activeStep < 3 || !!error}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>
            {error ? "Analysis Failed" : activeStep < 3 ? "Analyzing..." : "Continue"}
          </Text>
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
  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
    width: "85%",
    maxWidth: 320,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBg,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fallbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  fallbackText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  stepsCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  stepsCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  stepsList: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorWrapper: {
    width: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  stepTextCompleted: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  stepTextLoading: {
    color: colors.primary,
    fontWeight: "600",
  },
  stepTextPending: {
    color: colors.textSecondary,
    opacity: 0.6,
  },
  errorCard: {
    borderColor: colors.error + "40",
    backgroundColor: colors.surface,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.error,
  },
  errorDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: borderRadius.md,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    width: "100%",
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

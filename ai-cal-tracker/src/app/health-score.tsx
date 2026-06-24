import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "@clerk/clerk-expo";
import { getDailyLog, getUserFitnessPlan } from "../services/userService";
import { calculateHealthScore } from "../services/healthScoreService";

export default function HealthScoreScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const today = new Date().toISOString().split("T")[0];
        const plan = await getUserFitnessPlan(user.id);
        const log = await getDailyLog(user.id, today);
        
        const data = {
          caloriesConsumed: log?.consumedCalories || 0,
          caloriesGoal: plan?.dailyCalories || 2000,
          waterMl: log?.consumedWater || 0,
          waterGoal: plan?.waterIntakeLiters ? plan.waterIntakeLiters * 1000 : 2500,
          exerciseMinutes: log?.workouts?.reduce((sum, w) => sum + (w.duration || 0), 0) || 0,
          proteinConsumed: log?.consumedProtein || 0,
          proteinGoal: plan?.macros?.protein || 150,
          carbsConsumed: log?.consumedCarbs || 0,
          carbsGoal: plan?.macros?.carbs || 250,
          fatsConsumed: log?.consumedFats || 0,
          fatsGoal: plan?.macros?.fats || 70,
        };

        setDailyData(data);
        setHealthScore(calculateHealthScore(data));
      } catch (error) {
        console.error("Failed to load health score:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "🎉";
    if (score >= 60) return "💪";
    return "😕";
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      textAlign: "center",
      marginRight: 40,
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    },
    content: {
      padding: 20,
    },
    scoreCircleContainer: {
      alignItems: "center",
      marginBottom: 30,
    },
    scoreCircle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
      backgroundColor: colors.surface,
    },
    scoreText: {
      fontSize: 48,
      fontWeight: "800",
    },
    scoreLabel: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    scoreEmoji: {
      fontSize: 32,
      marginTop: 5,
    },
    componentsContainer: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 15,
    },
    componentCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    componentIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    componentInfo: {
      flex: 1,
    },
    componentName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    componentProgress: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    componentProgressFill: {
      height: "100%",
      borderRadius: 3,
    },
    componentScore: {
      fontSize: 18,
      fontWeight: "700",
    },
    recommendationsContainer: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
    },
    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    recommendationIcon: {
      marginRight: 10,
      marginTop: 2,
    },
    recommendationText: {
      fontSize: 15,
      color: colors.textPrimary,
      flex: 1,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Score</Text>
        </View>
        <View style={[styles.content, { flex: 1, justifyContent: "center" }]}>
          <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Score</Text>
      </View>
      <ScrollView style={styles.content}>
        {/* Main Score Circle */}
        {healthScore && (
          <>
            <View style={styles.scoreCircleContainer}>
              <View
                style={[
                  styles.scoreCircle,
                  { borderColor: getScoreColor(healthScore.total) },
                ]}
              >
                <Text
                  style={[
                    styles.scoreText,
                    { color: getScoreColor(healthScore.total) },
                  ]}
                >
                  {healthScore.total}
                </Text>
                <Text style={styles.scoreLabel}>Today's Score</Text>
              </View>
              <Text style={styles.scoreEmoji}>{getScoreEmoji(healthScore.total)}</Text>
            </View>

            {/* Components */}
            <View style={styles.componentsContainer}>
              <Text style={styles.sectionTitle}>Score Breakdown</Text>
              {[
                { key: "calories", name: "Calories", icon: "flame" },
                { key: "hydration", name: "Hydration", icon: "water" },
                { key: "exercise", name: "Exercise", icon: "fitness" },
                { key: "nutrition", name: "Nutrition", icon: "nutrition" },
              ].map((item) => {
                const iconMap: Record<string, any> = {
                  flame: "flame-outline",
                  water: "water-outline",
                  fitness: "barbell-outline",
                  nutrition: "restaurant-outline",
                };
                const color = getScoreColor(healthScore[item.key]);
                return (
                  <View key={item.key} style={styles.componentCard}>
                    <View
                      style={[
                        styles.componentIcon,
                        { backgroundColor: color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={iconMap[item.icon] as any}
                        size={24}
                        color={color}
                      />
                    </View>
                    <View style={styles.componentInfo}>
                      <Text style={styles.componentName}>{item.name}</Text>
                      <View style={styles.componentProgress}>
                        <View
                          style={[
                            styles.componentProgressFill,
                            {
                              width: `${healthScore[item.key]}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.componentScore, { color }]}>
                      {healthScore[item.key]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsContainer}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {healthScore.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons
                    name="bulb-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.recommendationIcon}
                  />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

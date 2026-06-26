import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { spacing, shadows, borderRadius } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { getDailyLog, getUserProfileData, getWeeklyAiInsights, saveWeeklyAiInsights, WeeklyAiInsights } from "../../services/userService";
import { BarChart, StackedBarChart, LineChart } from "react-native-chart-kit";
import { generateWeeklyInsights, WeeklyInsights } from "../../services/aiService";
// Removed date-fns import; using native date handling


export default function AnalyticsScreen() {
  const { userId } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const [weekStreak, setWeekStreak] = useState<Record<string, boolean>>({});
  const [weight, setWeight] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Weekly calories data state
  const [weeklyData, setWeeklyData] = useState<{
    consumed: number[];
    burned: number[];
    water: number[];
  }>({
    consumed: [0, 0, 0, 0, 0, 0, 0],
    burned: [0, 0, 0, 0, 0, 0, 0],
    water: [0, 0, 0, 0, 0, 0, 0],
  });
  const [activeTab, setActiveTab] = useState<"consumed" | "burned">("consumed");
  const [chartWidth, setChartWidth] = useState<number>(Dimensions.get("window").width - 80);
  const [energyChartWidth, setEnergyChartWidth] = useState<number>(Dimensions.get("window").width - 80);
  const [waterChartWidth, setWaterChartWidth] = useState<number>(Dimensions.get("window").width - 80);

  // AI Insights State
  const [insights, setInsights] = useState<WeeklyAiInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);

  const loadAiInsights = async (
    profile: any,
    weeklySummary: {
      totalConsumed: number;
      totalBurned: number;
      totalWater: number;
      avgConsumed: number;
      avgBurned: number;
      avgWater: number;
      weight: number;
      streak: number;
    }
  ) => {
    if (!userId) return;
    try {
      // 1. Check cached insights in Firebase
      const cached = await getWeeklyAiInsights(userId);
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;

      if (cached && cached.generatedAt && (now - new Date(cached.generatedAt).getTime() < sixHours)) {
        // Use fresh cached insights
        setInsights(cached);
      } else {
        // Stale or missing cache, fetch new insights from Gemini asynchronously
        setLoadingInsights(true);
        const newInsights = await generateWeeklyInsights(profile, weeklySummary);
        if (newInsights) {
          await saveWeeklyAiInsights(userId, newInsights);
          setInsights({
            ...newInsights,
            generatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("[Analytics] Error loading AI insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Helper to get dates of current week (Sun to Sat)
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const loadStreakAndWeight = async () => {
    if (!userId) return;
    try {
      // Load weight
      const profile = await getUserProfileData(userId);
      if (profile?.weight) setWeight(profile.weight);
      // Load streak and weekly calories for each day of the week
      const dates = getCurrentWeekDates();
      const streak: Record<string, boolean> = {};
      const consumedVals: number[] = [];
      const burnedVals: number[] = [];
      const waterVals: number[] = [];

      for (const d of dates) {
        const dateKey = d.toISOString().split('T')[0];
        const log = await getDailyLog(userId, dateKey);

        consumedVals.push(log?.consumedCalories || 0);
        burnedVals.push(log?.burnedCalories || 0);
        waterVals.push(log?.consumedWater || 0);

        // Consider any activity (meal, workout, water) as a streak
        const hasActivity = !!log && (
          (log.meals?.length ?? 0) > 0 ||
          (log.workouts?.length ?? 0) > 0 ||
          (log.consumedWater ?? 0) > 0
        );
        streak[dateKey] = hasActivity;
      }
      setWeekStreak(streak);
      setWeeklyData({
        consumed: consumedVals,
        burned: burnedVals,
        water: waterVals,
      });

      // Trigger AI insights loading in the background asynchronously
      if (profile) {
        const totalConsumed = consumedVals.reduce((a, b) => a + b, 0);
        const totalBurned = burnedVals.reduce((a, b) => a + b, 0);
        const totalWater = waterVals.reduce((a, b) => a + b, 0);
        const weightVal = weight || profile.weight || 70;
        
        // Calculate current streak count
        let streakVal = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        let checkDate: Date | null = null;
        if (streak[todayStr]) checkDate = today;
        else if (streak[yesterdayStr]) checkDate = yesterday;

        if (checkDate) {
          const temp = new Date(checkDate);
          for (let i = 0; i < 7; i++) {
            const key = temp.toISOString().split('T')[0];
            if (streak[key]) {
              streakVal++;
              temp.setDate(temp.getDate() - 1);
            } else {
              break;
            }
          }
        }

        // Fire and forget (do not await) so rendering charts is not blocked
        loadAiInsights(profile, {
          totalConsumed,
          totalBurned,
          totalWater,
          avgConsumed: Math.round(totalConsumed / 7),
          avgBurned: Math.round(totalBurned / 7),
          avgWater: Math.round(totalWater / 7),
          weight: weightVal,
          streak: streakVal,
        });
      }
    } catch (e) {
      console.error("[Analytics] Failed to load data", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStreakAndWeight();
    }, [userId])
  );

  const getStreakCount = () => {
    let count = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let checkDate: Date;
    if (weekStreak[todayStr]) {
      checkDate = today;
    } else if (weekStreak[yesterdayStr]) {
      checkDate = yesterday;
    } else {
      return 0;
    }

    const temp = new Date(checkDate);
    for (let i = 0; i < 7; i++) {
      const key = temp.toISOString().split('T')[0];
      if (weekStreak[key]) {
        count++;
        temp.setDate(temp.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  };

  const streakCount = getStreakCount();
  const weekDates = getCurrentWeekDates();
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]; // Sun to Sat
  const dddLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Progress</Text>
        <View style={styles.cardsRow}>
          {/* Daily Streak Card */}
          <TouchableOpacity style={styles.card} onPress={() => setModalVisible(true)}>
            <Image source={require("../../../assets/images/fire.png")} style={styles.icon} />
            <Text style={styles.cardLabel}>Day Streak</Text>
            <View style={styles.streakRow}>
              {weekDates.map((date, idx) => (
                <View key={date.toISOString()} style={styles.streakItem}>
                  <Text style={styles.dayLabel}>{dayLabels[idx]}</Text>
                  {!!weekStreak[date.toISOString().split('T')[0]] ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color={colors.textSecondary} />
                  )}
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Transparent Modal for Streak Details */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalDialog}
                activeOpacity={1}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Header row */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderLeft}>
                    <Image
                      source={require("../../../assets/images/fire.png")}
                      style={styles.modalFireIcon}
                    />
                    <View style={styles.modalHeaderTextContainer}>
                      <Text style={styles.modalStreakCount}>{streakCount}</Text>
                      <Text style={styles.modalStreakSub}>Daily Streak</Text>
                    </View>
                  </View>
                  <Text style={styles.modalKeepItUp}>Keep it up🔥</Text>
                </View>

                {/* 7 Days checkboxes */}
                <View style={styles.modalStreakRow}>
                  {weekDates.map((date, idx) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const isActive = !!weekStreak[dateStr];
                    return (
                      <View key={date.toISOString()} style={styles.modalStreakItem}>
                        {isActive ? (
                          <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={28} color={colors.textSecondary} />
                        )}
                        <Text style={styles.modalDayLabel}>{dddLabels[idx]}</Text>
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* My Weight Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/weight-picker",
                params: { currentWeight: weight !== null ? weight.toString() : "70" },
              })
            }
          >
            <Ionicons name="body" size={36} color={colors.primary} />
            <Text style={styles.cardLabel}>My Weight</Text>
            <Text style={styles.weightValue}>{weight !== null ? `${weight} kg` : "–"}</Text>
          </TouchableOpacity>
        </View>

        {/* AI Insights Bento Grid Section */}
        <View style={styles.bentoSection}>
          <View style={styles.bentoHeaderRow}>
            <Ionicons name="sparkles" size={20} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.bentoSectionTitle}>AI Coach Insights</Text>
          </View>

          {loadingInsights || !insights ? (
            // Skeleton Bento Grid
            <View style={styles.bentoGrid}>
              {/* Card 1: Health Score (Full Width Skeleton) */}
              <View style={[styles.bentoCard, styles.bentoFull, styles.skeletonCard]}>
                <View style={[styles.skeletonLine, { width: "40%", height: 24, marginBottom: 12 }]} />
                <View style={[styles.skeletonLine, { width: "80%", height: 16 }]} />
              </View>

              <View style={styles.bentoRow}>
                {/* Card 2: Calorie Insight (Half Width Skeleton) */}
                <View style={[styles.bentoCard, styles.bentoHalf, styles.skeletonCard]}>
                  <View style={[styles.skeletonLine, { width: "60%", height: 18, marginBottom: 10 }]} />
                  <View style={[styles.skeletonLine, { width: "90%", height: 12, marginBottom: 6 }]} />
                  <View style={[styles.skeletonLine, { width: "70%", height: 12 }]} />
                </View>

                {/* Card 3: Hydration (Half Width Skeleton) */}
                <View style={[styles.bentoCard, styles.bentoHalf, styles.skeletonCard]}>
                  <View style={[styles.skeletonLine, { width: "60%", height: 18, marginBottom: 10 }]} />
                  <View style={[styles.skeletonLine, { width: "90%", height: 12, marginBottom: 6 }]} />
                  <View style={[styles.skeletonLine, { width: "75%", height: 12 }]} />
                </View>
              </View>

              {/* Card 4: Workout (Full Width Skeleton) */}
              <View style={[styles.bentoCard, styles.bentoFull, styles.skeletonCard]}>
                <View style={[styles.skeletonLine, { width: "50%", height: 18, marginBottom: 10 }]} />
                <View style={[styles.skeletonLine, { width: "85%", height: 14 }]} />
              </View>
            </View>
          ) : (
            // Actual AI insights Bento Grid
            <View style={styles.bentoGrid}>
              {/* Card 1: Health Score & Motivation (Full Width - Styled premium with primary background) */}
              <View style={[styles.bentoCard, styles.bentoFull, styles.scoreCard]}>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNumber}>{insights.healthScore}</Text>
                    <Text style={styles.scoreLabel}>/100</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreTitle}>Weekly Health Score</Text>
                    <Text style={styles.scoreQuote}>"{insights.motivation}"</Text>
                  </View>
                </View>
              </View>

              <View style={styles.bentoRow}>
                {/* Card 2: Calorie Coach (Half Width - Green theme) */}
                <View style={[styles.bentoCard, styles.bentoHalf, styles.calorieInsightCard]}>
                  <View style={styles.bentoCardHeader}>
                    <Ionicons name="flame" size={18} color="#298F50" style={{ marginRight: 6 }} />
                    <Text style={styles.bentoCardTitle}>Calorie Coach</Text>
                  </View>
                  <Text style={styles.bentoCardText}>{insights.calorieInsight}</Text>
                </View>

                {/* Card 3: Hydration Hub (Half Width - Blue theme) */}
                <View style={[styles.bentoCard, styles.bentoHalf, styles.hydrationInsightCard]}>
                  <View style={styles.bentoCardHeader}>
                    <Ionicons name="water" size={18} color="#0EA5E9" style={{ marginRight: 6 }} />
                    <Text style={styles.bentoCardTitle}>Hydration Hub</Text>
                  </View>
                  <Text style={styles.bentoCardText}>{insights.hydrationInsight}</Text>
                </View>
              </View>

              {/* Card 4: Workout Optimizer (Full Width - Warm Red/Orange theme) */}
              <View style={[styles.bentoCard, styles.bentoFull, styles.workoutInsightCard]}>
                <View style={styles.bentoCardHeader}>
                  <Ionicons name="barbell" size={18} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={styles.bentoCardTitle}>Workout Optimizer</Text>
                </View>
                <Text style={styles.bentoCardText}>{insights.workoutInsight}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Weekly Overview Card */}
        <View
          style={styles.chartCard}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setChartWidth(width - 32); // Account for card padding (spacing.lg is 16 on each side)
          }}
        >
          <Text style={styles.chartCardTitle}>Weekly Overview</Text>

          {/* Tabs Container */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "consumed" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("consumed")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "consumed" && styles.activeTabText,
                ]}
              >
                Consumed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "burned" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("burned")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "burned" && styles.activeTabText,
                ]}
              >
                Burned
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary / Stats Container */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                {activeTab === "consumed" ? "Total Consumed" : "Total Burned"}
              </Text>
              <Text style={styles.statValue}>
                {weeklyData[activeTab].reduce((a, b) => a + b, 0).toLocaleString()}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Daily Average</Text>
              <Text style={styles.statValue}>
                {Math.round(
                  weeklyData[activeTab].reduce((a, b) => a + b, 0) / 7
                ).toLocaleString()}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.chartWrapper}>
            <BarChart
              data={{
                labels: dddLabels,
                datasets: [
                  {
                    data: weeklyData[activeTab],
                  },
                ],
              }}
              width={chartWidth}
              height={200}
              yAxisLabel=""
              yAxisSuffix=" kcal"
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) =>
                  activeTab === "consumed"
                    ? `rgba(41, 143, 80, ${opacity})` // colors.primary
                    : `rgba(76, 175, 114, ${opacity})`, // colors.primaryLight
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // colors.textSecondary
                style: {
                  borderRadius: borderRadius.md,
                },
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  strokeWidth: 1,
                  stroke: colors.border,
                  strokeDasharray: "3 3",
                },
              }}
              style={{
                marginVertical: spacing.md,
                borderRadius: borderRadius.md,
              }}
            />
          </View>
        </View>

        {/* Weekly Energy Card */}
        <View
          style={styles.chartCard}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setEnergyChartWidth(width - 32);
          }}
        >
          <Text style={styles.chartCardTitle}>Weekly Energy</Text>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Burned</Text>
              <Text style={[styles.statValue, { color: "#EF4444" }]}>
                {weeklyData.burned.reduce((a, b) => a + b, 0).toLocaleString()}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={[styles.statValue, { color: "#298F50" }]}>
                {weeklyData.consumed.reduce((a, b) => a + b, 0).toLocaleString()}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Net Balance</Text>
              <Text style={styles.statValue}>
                {(
                  weeklyData.consumed.reduce((a, b) => a + b, 0) -
                  weeklyData.burned.reduce((a, b) => a + b, 0)
                ).toLocaleString()}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
          </View>

          {/* Stacked Bar Chart */}
          <View style={styles.chartWrapper}>
            <StackedBarChart
              data={{
                labels: dddLabels,
                legend: ["Consumed", "Burned"],
                data: weeklyData.consumed.map((cVal, idx) => [cVal, weeklyData.burned[idx]]),
                barColors: ["#298F50", "#EF4444"],
              }}
              width={energyChartWidth}
              height={220}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: borderRadius.md,
                },
                barPercentage: 0.5,
                propsForBackgroundLines: {
                  strokeWidth: 1,
                  stroke: colors.border,
                  strokeDasharray: "3 3",
                },
              }}
              style={{
                marginVertical: spacing.md,
                borderRadius: borderRadius.md,
              }}
              hideLegend={true} // We will render our own customized beautiful legend at the bottom
            />
          </View>

          {/* Custom Beautiful Legend at the Bottom */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#298F50" }]} />
              <Text style={styles.legendText}>Consumed Calories (Green)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.legendText}>Burned Calories (Red)</Text>
            </View>
          </View>
        </View>

        {/* Water Consumption Card */}
        <View
          style={styles.chartCard}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setWaterChartWidth(width - 32);
          }}
        >
          <Text style={styles.chartCardTitle}>Water Consumption</Text>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Consumed</Text>
              <Text style={[styles.statValue, { color: "#0EA5E9" }]}>
                {weeklyData.water.reduce((a, b) => a + b, 0).toLocaleString()}{" "}
                <Text style={styles.statUnit}>ml</Text>
                <Text style={{ fontSize: 13, fontWeight: "normal", color: colors.textSecondary }}>
                  {" "}
                  ({(weeklyData.water.reduce((a, b) => a + b, 0) / 1000).toFixed(1)} L)
                </Text>
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Daily Average</Text>
              <Text style={styles.statValue}>
                {Math.round(
                  weeklyData.water.reduce((a, b) => a + b, 0) / 7
                ).toLocaleString()}{" "}
                <Text style={styles.statUnit}>ml/day</Text>
              </Text>
            </View>
          </View>

          {/* Bezier Line Chart */}
          <View style={styles.chartWrapper}>
            {waterChartWidth > 0 && (
              <LineChart
                data={{
                  labels: dddLabels,
                  datasets: [
                    {
                      data: weeklyData.water.every(v => v === 0) ? [0, 0, 0, 0, 0, 0, 0.1] : weeklyData.water,
                    },
                  ],
                }}
                width={waterChartWidth}
                height={200}
                yAxisLabel=""
                yAxisSuffix=" ml"
                fromZero
                bezier
                withDots={false}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`, // sky blue line
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: borderRadius.md,
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#0EA5E9",
                    onPressIn: undefined,
                    onPressOut: undefined,
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    stroke: colors.border,
                    strokeDasharray: "3 3",
                  },
                }}
                style={{
                  marginVertical: spacing.md,
                  borderRadius: borderRadius.md,
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  editIconButton: { marginLeft: spacing.sm },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: spacing.sm,
    resizeMode: "contain",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: spacing.xs,
  },
  streakItem: {
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  weightValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalDialog: {
    width: "90%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
    ...shadows.md,
  },
  closeButton: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    zIndex: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalFireIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  modalHeaderTextContainer: {
    marginLeft: spacing.sm,
  },
  modalStreakCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
    lineHeight: 36,
  },
  modalStreakSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalKeepItUp: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  modalStreakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: spacing.xs,
    marginTop: spacing.md,
  },
  modalStreakItem: {
    alignItems: "center",
  },
  modalDayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  chartCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.sm,
  },
  activeTabButton: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "normal",
    color: colors.textSecondary,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: spacing.sm,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  bentoSection: {
    marginTop: spacing.xl,
    width: "100%",
  },
  bentoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  bentoSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  bentoGrid: {
    flexDirection: "column",
    gap: spacing.md,
    width: "100%",
  },
  bentoRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  bentoCard: {
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  bentoFull: {
    width: "100%",
  },
  bentoHalf: {
    flex: 1,
  },
  scoreCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    ...shadows.md,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
  },
  scoreLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  scoreInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  scoreTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreQuote: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
    marginTop: 2,
    fontStyle: "italic",
  },
  calorieInsightCard: {
    backgroundColor: "rgba(41, 143, 80, 0.03)",
    borderColor: "rgba(41, 143, 80, 0.15)",
  },
  hydrationInsightCard: {
    backgroundColor: "rgba(14, 165, 233, 0.03)",
    borderColor: "rgba(14, 165, 233, 0.15)",
  },
  workoutInsightCard: {
    backgroundColor: "rgba(255, 107, 107, 0.03)",
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  bentoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  bentoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  bentoCardText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    minHeight: 100,
  },
  skeletonLine: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    borderRadius: 4,
  },
});


import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";

import { borderRadius, spacing, shadows } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { AnimatedButton } from "../../components/AnimatedButton";
import { HomeHeader } from "../../components/HomeHeader";
import { DateSelector } from "../../components/DateSelector";
import { SegmentedHalfCircleProgress30 } from "../../components/HalfProgress";
import { getUserFitnessPlan, getDailyLog, DailyLog, updateFitnessPlanTargets, logWater, addMealLog } from "../../services/userService";
import { checkAndSyncReminders } from "../../services/notificationService";
import { db } from "../../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { analyzeTextMeal, FoodAnalysisResult } from "../../services/aiService";

const FULL_GLASS_IMG = require("../../../assets/images/full_glass.png");
const HALF_GLASS_IMG = require("../../../assets/images/half_glass.png");
const EMPTY_GLASS_IMG = require("../../../assets/images/empty_glass.png");

export default function Index() {
  const { userId } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const [aiMealText, setAiMealText] = useState("");
  const [isAiInputFocused, setIsAiInputFocused] = useState(false);
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);

  // Date and Data State
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split("T")[0];
  });

  const [fitnessPlan, setFitnessPlan] = useState<any>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getUserFitnessPlan(userId).then(setFitnessPlan);
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedDateStr) return;
    
    setLoading(true);
    const logRef = doc(db, "users", userId, "dailyLogs", selectedDateStr);
    
    const unsubscribe = onSnapshot(logRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyLog(docSnap.data() as DailyLog);
      } else {
        setDailyLog(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to daily log:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, selectedDateStr]);

  const handleDateSelect = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - (offset * 60 * 1000));
    setSelectedDateStr(local.toISOString().split("T")[0]);
  };

  // Calculations
  const targetCalories = fitnessPlan?.dailyCalories || 2200;
  const targetProtein = fitnessPlan?.macros?.protein || 130;
  const targetFats = fitnessPlan?.macros?.fats || 70;
  const targetCarbs = fitnessPlan?.macros?.carbs || 250;

  const consumedCalories = dailyLog?.consumedCalories || 0;
  const consumedProtein = dailyLog?.consumedProtein || 0;
  const consumedFats = dailyLog?.consumedFats || 0;
  const consumedCarbs = dailyLog?.consumedCarbs || 0;
  const burnedCalories = dailyLog?.burnedCalories || 0;

  // Remaining Calories = Target Calories - Consumed Food Calories + Burned Workout Calories
  const remainingCalories = Math.max(0, targetCalories - consumedCalories + burnedCalories);
  const progressRatio = targetCalories > 0 ? Math.max(0, consumedCalories - burnedCalories) / targetCalories : 0;

  const proteinProgress = targetProtein > 0 ? consumedProtein / targetProtein : 0;
  const fatsProgress = targetFats > 0 ? consumedFats / targetFats : 0;
  const carbsProgress = targetCarbs > 0 ? consumedCarbs / targetCarbs : 0;

  // Edit Targets Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editFats, setEditFats] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  const openEditModal = () => {
    setEditCalories(targetCalories.toString());
    setEditProtein(targetProtein.toString());
    setEditFats(targetFats.toString());
    setEditCarbs(targetCarbs.toString());
    setIsEditModalVisible(true);
  };

  const handleAnalyzeMeal = async () => {
    if (!aiMealText.trim() || !userId) return;
    setIsAnalyzingMeal(true);
    try {
      const result = await analyzeTextMeal(aiMealText);
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await addMealLog(userId, dateString, {
        name: result.foodName,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fat,
        time: timeString,
      });

      setAiMealText("");
      Alert.alert(
        "Logged Successfully",
        `Added "${result.foodName}" (${result.calories} kcal) to your daily log!`
      );
    } catch (error) {
      console.error("Failed to log meal:", error);
      Alert.alert("Error", "Failed to analyze and log the meal. Please try again.");
    } finally {
      setIsAnalyzingMeal(false);
    }
  };

  const handleSaveTargets = async () => {
    if (!userId) return;
    setIsSavingTargets(true);
    try {
      const newTargets = {
        calories: Number(editCalories) || 0,
        protein: Number(editProtein) || 0,
        fats: Number(editFats) || 0,
        carbs: Number(editCarbs) || 0,
      };
      await updateFitnessPlanTargets(userId, newTargets);
      // Refresh locally
      const updatedPlan = await getUserFitnessPlan(userId);
      setFitnessPlan(updatedPlan);
      setIsEditModalVisible(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingTargets(false);
    }
  };

  // Water Modal State
  const [isWaterModalVisible, setIsWaterModalVisible] = useState(false);
  const [waterAmountToAdd, setWaterAmountToAdd] = useState("250"); // default 1 glass in ml
  const [isLoggingWater, setIsLoggingWater] = useState(false);

  const handleLogWater = async () => {
    if (!userId) return;
    setIsLoggingWater(true);
    try {
      const amount = Number(waterAmountToAdd) || 0;
      await logWater(userId, selectedDateStr, amount);
      await checkAndSyncReminders(userId);
      setIsWaterModalVisible(false);
      setWaterAmountToAdd("250");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingWater(false);
    }
  };

  // Water Calculations in milliliters (ml)
  const targetWaterFromPlan = fitnessPlan?.waterIntake || fitnessPlan?.waterIntakeLiters || 3;
  const targetWaterMl = targetWaterFromPlan < 15 ? targetWaterFromPlan * 1000 : targetWaterFromPlan;
  const consumedWaterMl = dailyLog?.consumedWater || 0;

  // Base assumption: 1 glass = 250ml
  let totalGlassesTarget = Math.ceil(targetWaterMl / 250);
  let glassSizeMl = 250;

  // Enforce max 9 glasses (1 row) by dynamically calculating glass size
  if (totalGlassesTarget > 9) {
    totalGlassesTarget = 9;
    glassSizeMl = targetWaterMl / 9;
  }

  const consumedGlasses = consumedWaterMl / glassSizeMl;

  const fullGlassesCount = Math.floor(consumedGlasses);
  const hasHalfGlass = (consumedGlasses % 1) >= 0.5;
  
  const displayGlassesCount = Math.min(9, totalGlassesTarget);

  // Build array for rendering
  const glassIcons = [];
  for (let i = 0; i < fullGlassesCount && glassIcons.length < 9; i++) {
    glassIcons.push("full");
  }
  if (hasHalfGlass && glassIcons.length < 9) {
    glassIcons.push("half");
  }
  while (glassIcons.length < displayGlassesCount) {
    glassIcons.push("empty");
  }

  const waterLeftMl = Math.max(0, targetWaterMl - consumedWaterMl);
  const glassesLeft = Math.max(0, totalGlassesTarget - consumedGlasses);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

      {/* Header */}
      <HomeHeader />

      {/* Date Selector */}
      <DateSelector onDateSelect={handleDateSelect} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Calorie Card */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieCardHeader}>
              <Text style={styles.calorieCardTitle}>Remaining Calories</Text>
              <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={openEditModal}>
                <Ionicons name="pencil" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.halfProgressContainer}>
              <SegmentedHalfCircleProgress30
                progress={progressRatio}
                value={remainingCalories.toLocaleString()}
                label="kcal left"
                size={240}
              />
            </View>

            {burnedCalories > 0 && (
              <View style={styles.burnedBadge}>
                <Ionicons name="flame" size={14} color="#FF6B6B" style={{ marginRight: 4 }} />
                <Text style={styles.burnedBadgeText}>
                  Burned {burnedCalories} kcal today
                </Text>
              </View>
            )}

            {/* Progress Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricTitle}>Target</Text>
                <Text style={styles.metricValue}>{targetCalories.toLocaleString()} kcal</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricTitle}>Eaten</Text>
                <Text style={styles.metricValue}>{consumedCalories.toLocaleString()} kcal</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricTitle}>Burned</Text>
                <Text style={[styles.metricValue, burnedCalories > 0 && { color: "#FF6B6B" }]}>
                  {burnedCalories.toLocaleString()} kcal
                </Text>
              </View>
            </View>

            {/* Card Macros Section */}
            <View style={styles.cardMacrosSection}>
              <View style={styles.cardMacroItem}>
                <Ionicons name="restaurant" size={24} color="#FF6B6B" />
                <Text style={styles.cardMacroValue}>
                  {Math.max(0, targetProtein - consumedProtein)}g
                </Text>
                <Text style={styles.cardMacroLabel}>Protein Left</Text>
                <View style={styles.miniProgressBarBg}>
                  <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, proteinProgress * 100)}%`, backgroundColor: "#FF6B6B" }]} />
                </View>
              </View>

              <View style={styles.cardMacroItem}>
                <Ionicons name="water" size={24} color="#FCC419" />
                <Text style={styles.cardMacroValue}>
                  {Math.max(0, targetFats - consumedFats)}g
                </Text>
                <Text style={styles.cardMacroLabel}>Fat Left</Text>
                <View style={styles.miniProgressBarBg}>
                  <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, fatsProgress * 100)}%`, backgroundColor: "#FCC419" }]} />
                </View>
              </View>

              <View style={styles.cardMacroItem}>
                <Ionicons name="leaf" size={24} color="#4DABF7" />
                <Text style={styles.cardMacroValue}>
                  {Math.max(0, targetCarbs - consumedCarbs)}g
                </Text>
                <Text style={styles.cardMacroLabel}>Carbs Left</Text>
                <View style={styles.miniProgressBarBg}>
                  <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, carbsProgress * 100)}%`, backgroundColor: "#4DABF7" }]} />
                </View>
              </View>
            </View>
          </View>

          {/* End of Day Review Check-in */}
          {progressRatio < 0.8 && (
            <TouchableOpacity 
              style={[styles.calorieCard, { backgroundColor: '#1e293b', borderColor: '#334155', padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => router.push({ pathname: '/coach-call', params: { shortfall: Math.max(0, targetCalories - consumedCalories), calories: consumedCalories, target: targetCalories } })}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="sparkles" size={18} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>End of Day Review</Text>
                </View>
                <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18 }}>
                  You are {Math.max(0, targetCalories - consumedCalories)} kcal under your target. Tap here to chat with your AI Coach for a quick check-in.
                </Text>
              </View>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="call" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Water Intake Card */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieCardHeader}>
              <Text style={styles.calorieCardTitle}>Water Intake</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>
                {consumedWaterMl} / {targetWaterMl} ml
              </Text>
              <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={() => router.push("/log-water")}>
                <Ionicons name="pencil" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.glassesContainer}>
              {glassIcons.map((type, index) => (
                <Image
                  key={index}
                  source={
                    type === "full" ? FULL_GLASS_IMG :
                      type === "half" ? HALF_GLASS_IMG : EMPTY_GLASS_IMG
                  }
                  style={styles.glassIcon}
                  resizeMode="contain"
                />
              ))}
            </View>

            <Text style={styles.waterFooterText}>
              {consumedWaterMl} ml consumed • {waterLeftMl} ml left ({glassesLeft % 1 === 0 ? glassesLeft : glassesLeft.toFixed(1)} glasses left)
            </Text>
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {((dailyLog?.meals && dailyLog.meals.length > 0) || (dailyLog?.workouts && dailyLog.workouts.length > 0)) ? (
            <View style={styles.recentActivityContainer}>
              {[
                ...(dailyLog.meals || []).map(m => ({ ...m, type: "meal" as const })),
                ...(dailyLog.workouts || []).map(w => ({ ...w, type: "workout" as const }))
              ]
              .sort((a, b) => {
                const getMinutes = (t: string) => {
                  if (!t) return 0;
                  const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                  if (!match) return 0;
                  let h = parseInt(match[1], 10);
                  const m = parseInt(match[2], 10);
                  if (match[3]?.toUpperCase() === "PM" && h < 12) h += 12;
                  if (match[3]?.toUpperCase() === "AM" && h === 12) h = 0;
                  return h * 60 + m;
                };
                return getMinutes(a.time || "") - getMinutes(b.time || "");
              })
              .map((item, index) => {
                if (item.type === "meal") {
                  return (
                    <View key={`meal-${item.id || index}`} style={styles.mealLogItem}>
                      <View style={styles.mealIconWrapper}>
                        <Ionicons name="restaurant" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{item.name}</Text>
                        <Text style={styles.mealTime}>{item.time || "Logged today"}</Text>
                      </View>
                      <Text style={styles.mealCalories}>+{item.calories} kcal</Text>
                    </View>
                  );
                } else {
                  const isWeightLifting = item.name.includes("Weight Lifting");
                  return (
                    <View key={`workout-${item.id || index}`} style={styles.mealLogItem}>
                      <View style={[styles.mealIconWrapper, { backgroundColor: "rgba(255, 107, 107, 0.1)" }]}>
                        <Ionicons name={isWeightLifting ? "barbell" : "walk"} size={20} color="#FF6B6B" />
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{item.name}</Text>
                        <Text style={styles.mealTime}>{item.duration} mins • {item.time || "Logged today"}</Text>
                      </View>
                      <Text style={[styles.mealCalories, { color: "#FF6B6B" }]}>-{item.caloriesBurned} kcal</Text>
                    </View>
                  );
                }
              })}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconWrapper}>
                <Ionicons name="fitness-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>No Activities Logged</Text>
              <Text style={styles.emptyStateDesc}>
                Tap the + button below to log a meal or workout for the day and crush your targets!
              </Text>
            </View>
          )}

          {/* Recipe Hub Banner */}
          <TouchableOpacity 
            style={[styles.aiLogCard, { backgroundColor: '#16a34a', marginBottom: 24 }]} 
            onPress={() => router.push('/recipe-hub')}
            activeOpacity={0.8}
          >
            <View style={[styles.aiHeader, { borderBottomColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="restaurant" size={20} color="#fff" />
              <Text style={[styles.aiTitle, { color: '#fff' }]}>Recipe Hub</Text>
            </View>
            <Text style={[styles.aiDesc, { color: '#dcfce7' }]}>
              Access the AI Recipe Generator, Meal Planner, Pantry Tracker, and Shopping List.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Open Hub</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* AI Prompt Input (Mock Feature) */}
          <Text style={styles.sectionTitle}>Quick AI Meal Tracker</Text>
          <View style={styles.aiLogCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.aiTitle}>AI Calorie Logger</Text>
            </View>
            <Text style={styles.aiDesc}>
              Type your meal below. Our AI will analyze the calories and nutritional values.
            </Text>
            <View
              style={[
                styles.aiInputWrapper,
                isAiInputFocused && styles.aiInputWrapperFocused,
              ]}
            >
              <TextInput
                value={aiMealText}
                onChangeText={setAiMealText}
                placeholder="e.g. 2 fried eggs, 2 slices of toast"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => setIsAiInputFocused(true)}
                onBlur={() => setIsAiInputFocused(false)}
                style={styles.aiInput}
              />
              <AnimatedButton
                variant="primary"
                style={styles.aiSendBtn}
                onPress={handleAnalyzeMeal}
                loading={isAnalyzingMeal}
              >
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </AnimatedButton>
            </View>
          </View>

          {/* Sync Info Footer */}
          <View style={styles.syncFooter}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={styles.syncFooterText}>
              Dashboard Synced successfully.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Edit Targets Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Targets</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Calories Input */}
              <Text style={styles.modalLabel}>Daily Calories</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="flame-outline" size={20} color={colors.warning} style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editCalories}
                  onChangeText={setEditCalories}
                />
              </View>

              {/* Protein Input */}
              <Text style={styles.modalLabel}>Protein (g)</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="restaurant-outline" size={20} color="#FF6B6B" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editProtein}
                  onChangeText={setEditProtein}
                />
              </View>

              {/* Fats Input */}
              <Text style={styles.modalLabel}>Fats (g)</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="water-outline" size={20} color="#FCC419" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editFats}
                  onChangeText={setEditFats}
                />
              </View>

              {/* Carbs Input */}
              <Text style={styles.modalLabel}>Carbs (g)</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="leaf-outline" size={20} color="#4DABF7" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editCarbs}
                  onChangeText={setEditCarbs}
                />
              </View>

              <AnimatedButton
                variant="primary"
                onPress={handleSaveTargets}
                loading={isSavingTargets}
                style={{ marginTop: spacing.md }}
              >
                <Text style={styles.submitBtnText}>Save Targets</Text>
              </AnimatedButton>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Log Water Modal */}
      <Modal
        visible={isWaterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsWaterModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Water</Text>
              <TouchableOpacity onPress={() => setIsWaterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Amount to Add (ml)</Text>
            <View style={styles.modalInputWrapper}>
              <Ionicons name="water-outline" size={20} color="#4DABF7" style={styles.modalInputIcon} />
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={waterAmountToAdd}
                onChangeText={setWaterAmountToAdd}
              />
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.lg, marginTop: -10 }}>
              {glassSizeMl.toFixed(0)} ml = 1 glass in your visual tracker
            </Text>

            <AnimatedButton
              variant="primary"
              onPress={handleLogWater}
              loading={isLoggingWater}
            >
              <Text style={styles.submitBtnText}>Add Water</Text>
            </AnimatedButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  calorieCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.12)",
    alignItems: "center",
    marginBottom: 28,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  burnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  burnedBadgeText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "bold",
  },
  calorieCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.lg,
  },
  calorieCardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  halfProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  metricItem: {
    alignItems: "center",
  },
  metricTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  cardMacrosSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  cardMacroItem: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "rgba(150, 150, 150, 0.04)",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.08)",
  },
  cardMacroValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  cardMacroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  miniProgressBarBg: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  miniProgressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  glassesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    marginVertical: spacing.lg,
  },
  glassIcon: {
    width: 28,
    height: 40,
    opacity: 0.9,
  },
  waterFooterText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    fontWeight: "500",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  recentActivityContainer: {
    marginBottom: spacing.xxl,
  },
  mealLogItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.1)",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  mealIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(41, 143, 80, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  mealTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginBottom: spacing.xxl,
  },
  emptyStateIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(41, 143, 80, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  aiLogCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(41, 143, 80, 0.25)",
    padding: 24,
    marginBottom: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  aiTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 6,
  },
  aiDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  aiInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  aiInputWrapperFocused: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.surface,
  },
  aiInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    height: "100%",
  },
  aiSendBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  syncFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  syncFooterText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.lg,
  },
  modalInputIcon: {
    marginRight: spacing.sm,
  },
  modalInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    height: "100%",
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

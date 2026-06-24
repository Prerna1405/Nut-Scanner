import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { getUserProfileData, logWorkout } from "../services/userService";
import { checkAndSyncReminders } from "../services/notificationService";

function parseHeightToCm(heightStr: string): number {
  try {
    if (!heightStr) return 170;
    const match = heightStr.match(/(\d+)'(\d+)"?/);
    if (match) {
      const feet = parseInt(match[1], 10);
      const inches = parseInt(match[2], 10);
      return (feet * 12 + inches) * 2.54;
    }
    const val = parseFloat(heightStr);
    if (!isNaN(val)) return val;
  } catch (e) {
    console.warn("Failed to parse height:", heightStr, e);
  }
  return 170; // fallback in cm
}

function calculateAge(birthdateStr: string): number {
  try {
    if (!birthdateStr) return 28;
    const birthDate = new Date(birthdateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) ? 28 : age;
  } catch (e) {
    console.warn("Failed to calculate age:", birthdateStr, e);
  }
  return 28; // fallback age
}

export default function WorkoutResult() {
  const router = useRouter();
  const { userId } = useAuth();
  const { type, intensity, duration } = useLocalSearchParams<{
    type: string;
    intensity: "Low" | "Medium" | "High";
    duration: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    setIsLoading(true);
    getUserProfileData(userId)
      .then((data) => {
        setProfileData(data);
        
        // Calories calculation
        const weight = data?.weight || 70; // kg
        const heightCm = parseHeightToCm(data?.height || "");
        const age = calculateAge(data?.birthdate || "");
        const gender = data?.gender?.toLowerCase() || "male";
        const durationMins = parseInt(duration || "30", 10);

        // Calculate BMR (Mifflin-St Jeor)
        let bmr = 10 * weight + 6.25 * heightCm - 5 * age;
        if (gender === "male") {
          bmr += 5;
        } else {
          bmr -= 161;
        }

        // Determine MET value
        let met = 1.0;
        if (type === "Cardio") {
          if (intensity === "Low") met = 5.0;
          else if (intensity === "Medium") met = 8.0;
          else met = 11.5;
        } else {
          // Weight Lifting
          if (intensity === "Low") met = 3.5;
          else if (intensity === "Medium") met = 5.5;
          else met = 7.5;
        }

        // BMR-corrected MET formula: Calories = Duration (mins) * MET * (BMR / 1440)
        const calculatedBurn = Math.round(durationMins * met * (bmr / 1440));
        setCaloriesBurned(calculatedBurn > 0 ? calculatedBurn : 0);
      })
      .catch((err) => {
        console.error("Error loading user profile for workout calculation:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId, type, intensity, duration]);

  const handleLogWorkout = async () => {
    if (!userId) return;
    setIsLogging(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const workoutName = type === "Cardio" ? "Cardio Workout" : "Weight Lifting";
      const durationMins = parseInt(duration || "30", 10);

      await logWorkout(userId, dateString, {
        name: `${workoutName} (${intensity})`,
        duration: durationMins,
        caloriesBurned: caloriesBurned,
        time: timeString,
      });

      // Mute notification reminders since user logged today's workout
      checkAndSyncReminders(userId);

      Alert.alert("Success", "Workout logged successfully!", [
        { text: "OK", onPress: () => router.dismissAll() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to log workout to database.");
    } finally {
      setIsLogging(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing workout performance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const durationMins = parseInt(duration || "30", 10);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Analysis</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.resultCard}>
          {/* Glowing Fire Icon */}
          <View style={styles.fireRingOuter}>
            <View style={styles.fireRingInner}>
              <Ionicons name="flame" size={80} color="#FF6B6B" />
            </View>
          </View>

          <Text style={styles.subtitle}>Your Workout Burned</Text>
          <Text style={styles.caloriesText}>{caloriesBurned} <Text style={styles.calsLabel}>Cals</Text></Text>

          {/* Details list */}
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Workout</Text>
              <Text style={styles.detailValue}>{type === "Cardio" ? "Cardio / Run" : "Weight Lifting"}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{durationMins} mins</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Intensity</Text>
              <Text style={styles.detailValue}>{intensity}</Text>
            </View>
          </View>
        </View>

        {/* Calculation Factors Card */}
        <View style={styles.factorsCard}>
          <Text style={styles.factorsTitle}>Tailored Caloric Metrics</Text>
          <Text style={styles.factorsDesc}>
            Calculated based on metabolic coefficients (METs) and your onboarding biometric profile.
          </Text>
          <View style={styles.factorBadges}>
            <View style={styles.factorBadge}>
              <Text style={styles.factorBadgeText}>⚖️ {profileData?.weight || 70} kg</Text>
            </View>
            <View style={styles.factorBadge}>
              <Text style={styles.factorBadgeText}>📏 {profileData?.height || "5'10\""}</Text>
            </View>
            <View style={styles.factorBadge}>
              <Text style={styles.factorBadgeText}>🎂 {calculateAge(profileData?.birthdate)} yrs</Text>
            </View>
            <View style={styles.factorBadge}>
              <Text style={styles.factorBadgeText}>👤 {profileData?.gender || "Male"}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <AnimatedButton 
          variant="primary" 
          onPress={handleLogWorkout}
          loading={isLogging}
          style={styles.logButton}
        >
          <Text style={styles.logBtnText}>Log to Daily Tracker</Text>
        </AnimatedButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: 15, color: colors.textSecondary, fontWeight: "500" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs, marginRight: spacing.md },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  content: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  resultCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl,
    alignItems: "center", borderWidth: 1, borderColor: colors.border, ...shadows.md,
    marginBottom: spacing.xl,
  },
  fireRingOuter: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(255, 107, 107, 0.06)",
    justifyContent: "center", alignItems: "center",
    marginBottom: spacing.xl,
  },
  fireRingInner: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    justifyContent: "center", alignItems: "center",
  },
  subtitle: { fontSize: 16, color: colors.textSecondary, fontWeight: "600", letterSpacing: 0.5 },
  caloriesText: { fontSize: 44, fontWeight: "900", color: "#FF6B6B", marginVertical: spacing.sm },
  calsLabel: { fontSize: 20, fontWeight: "600", color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, width: "100%", marginVertical: spacing.xl },
  detailRow: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
  detailItem: { alignItems: "center", flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, color: colors.textPrimary, fontWeight: "700" },
  detailDivider: { width: 1, backgroundColor: colors.border, height: 30 },
  
  factorsCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  factorsTitle: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary, marginBottom: 6 },
  factorsDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  factorBadges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  factorBadge: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, paddingVertical: 6, paddingHorizontal: 12,
  },
  factorBadgeText: { fontSize: 12, color: colors.textPrimary, fontWeight: "600" },

  footer: { padding: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  logButton: { backgroundColor: "#FF6B6B" }, // highlight exercise log button with red/coral theme
  logBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});

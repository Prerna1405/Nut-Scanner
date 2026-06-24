import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { logWorkout } from "../services/userService";
import { checkAndSyncReminders } from "../services/notificationService";

export default function WorkoutManual() {
  const router = useRouter();
  const { userId } = useAuth();

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [duration, setDuration] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const handleSave = async () => {
    if (!name || !calories) {
      Alert.alert("Missing Info", "Please enter at least a workout name and calories burned.");
      return;
    }
    if (!userId) return;

    setIsLogging(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await logWorkout(userId, dateString, {
        name: name,
        duration: Number(duration) || 0,
        caloriesBurned: Number(calories) || 0,
        time: timeString,
      });

      // Mute notification reminders since user logged today's workout
      checkAndSyncReminders(userId);

      Alert.alert("Success", "Manual workout logged successfully!", [
        { text: "OK", onPress: () => router.dismissAll() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not log manual workout. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Manually</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {/* Workout Name */}
            <Text style={styles.label}>Workout Name / Activity</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="walk-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Yoga, Swimming, Hiking"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Calories Burned */}
            <Text style={styles.label}>Calories Burned (kcal)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="flame-outline" size={20} color="#FF6B6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 250"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            {/* Duration */}
            <Text style={styles.label}>Duration (minutes, optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 45"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedButton
            variant="primary"
            onPress={handleSave}
            loading={isLogging}
            style={styles.logButton}
          >
            <Text style={styles.logBtnText}>Save Workout</Text>
          </AnimatedButton>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs, marginRight: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary },
  content: { padding: spacing.xl },
  formCard: {
    backgroundColor: colors.surface, padding: spacing.xl, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.md, marginBottom: spacing.xxl,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 48, marginBottom: spacing.lg,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, height: "100%" },
  footer: { padding: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  logButton: { backgroundColor: "#FF6B6B" },
  logBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});

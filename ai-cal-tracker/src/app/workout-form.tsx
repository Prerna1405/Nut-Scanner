import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";

export default function WorkoutForm() {
  const router = useRouter();
  const { type } = useLocalSearchParams(); // 'Cardio' or 'Weight Lifting'

  const title = type === "Cardio" ? "Run / Cardio" : "Weight Lifting";
  const desc = type === "Cardio" 
    ? "Running, walking, cycling, or other endurance activities." 
    : "Gym sessions, machines, free weights, or resistance training.";

  const [intensity, setIntensity] = useState<"Low" | "Medium" | "High">("Medium");
  const [durationStr, setDurationStr] = useState("30");

  const durationOptions = [15, 30, 60, 90];

  const handleContinue = () => {
    router.push({
      pathname: "/workout-result",
      params: {
        type: type,
        intensity: intensity,
        duration: durationStr,
      }
    });
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
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.description}>{desc}</Text>

          {/* Intensity Card */}
          <Text style={styles.sectionLabel}>Workout Intensity</Text>
          <View style={styles.card}>
            <View style={styles.sliderTrack}>
              <View style={styles.sliderLine} />
              
              {/* Low */}
              <TouchableOpacity style={styles.sliderPointContainer} onPress={() => setIntensity("Low")}>
                <View style={[styles.sliderPoint, intensity === "Low" && styles.sliderPointActive]} />
                <Text style={[styles.sliderLabel, intensity === "Low" && styles.sliderLabelActive]}>Low</Text>
              </TouchableOpacity>
              
              {/* Medium */}
              <TouchableOpacity style={styles.sliderPointContainer} onPress={() => setIntensity("Medium")}>
                <View style={[styles.sliderPoint, intensity === "Medium" && styles.sliderPointActive]} />
                <Text style={[styles.sliderLabel, intensity === "Medium" && styles.sliderLabelActive]}>Medium</Text>
              </TouchableOpacity>
              
              {/* High */}
              <TouchableOpacity style={styles.sliderPointContainer} onPress={() => setIntensity("High")}>
                <View style={[styles.sliderPoint, intensity === "High" && styles.sliderPointActive]} />
                <Text style={[styles.sliderLabel, intensity === "High" && styles.sliderLabelActive]}>High</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Duration Card */}
          <Text style={styles.sectionLabel}>Duration (Minutes)</Text>
          <View style={styles.card}>
            <View style={styles.chipContainer}>
              {durationOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={[styles.chip, durationStr === opt.toString() && styles.chipActive]}
                  onPress={() => setDurationStr(opt.toString())}
                >
                  <Text style={[styles.chipText, durationStr === opt.toString() && styles.chipTextActive]}>
                    {opt} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.manualEntryLabel}>Or enter manually:</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={durationStr}
                onChangeText={setDurationStr}
                placeholder="e.g. 45"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>mins</Text>
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <AnimatedButton variant="primary" onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Calculate Burn</Text>
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  content: { flex: 1, padding: spacing.xl },
  description: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xxl, lineHeight: 20 },
  sectionLabel: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl,
    marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border, ...shadows.sm
  },
  // Custom discrete slider
  sliderTrack: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", position: "relative",
    paddingVertical: spacing.lg,
  },
  sliderLine: {
    position: "absolute", top: "50%", left: 20, right: 20, height: 4,
    backgroundColor: colors.border, borderRadius: 2, transform: [{ translateY: -2 }],
  },
  sliderPointContainer: { alignItems: "center", width: 60 },
  sliderPoint: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 4, borderColor: colors.border, marginBottom: 8,
  },
  sliderPointActive: { borderColor: colors.primary, backgroundColor: colors.primary, transform: [{ scale: 1.1 }] },
  sliderLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  sliderLabelActive: { color: colors.primary, fontWeight: "bold" },
  
  // Chips
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  chip: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.round,
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  manualEntryLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "500" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 48,
  },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  
  footer: { padding: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  continueBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});

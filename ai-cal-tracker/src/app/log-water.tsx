import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { logWater } from "../services/userService";
import { checkAndSyncReminders } from "../services/notificationService";
import { useToast } from "../components/Toast";

const FULL_GLASS_IMG = require("../../assets/images/full_glass.png");
const HALF_GLASS_IMG = require("../../assets/images/half_glass.png");
const EMPTY_GLASS_IMG = require("../../assets/images/empty_glass.png");

export default function LogWater() {
  const router = useRouter();
  const { userId } = useAuth();
  const { showToast } = useToast();
  
  const [ml, setMl] = useState(0); // starts at 0 ml
  const [isLogging, setIsLogging] = useState(false);

  const handleIncrement = () => {
    if (ml >= 1000) {
      return; // maximum 1000ml (4 full glasses)
    }
    setMl(prev => prev + 125);
  };

  const handleDecrement = () => {
    if (ml <= 0) {
      return; // minimum 0ml
    }
    setMl(prev => prev - 125);
  };

  // Build the list of glass images to render based on the current ml selection
  const renderGlasses = () => {
    if (ml === 0) {
      return (
        <Image 
          source={EMPTY_GLASS_IMG} 
          style={styles.bigGlassIcon} 
          resizeMode="contain" 
        />
      );
    }

    const fullCount = Math.floor(ml / 250);
    const remainder = ml % 250;
    const hasHalf = remainder >= 125;

    const glassesList: string[] = [];
    for (let i = 0; i < fullCount; i++) {
      glassesList.push("full");
    }
    if (hasHalf) {
      glassesList.push("half");
    }

    return (
      <View style={styles.glassesContainer}>
        {glassesList.map((type, idx) => (
          <Image
            key={idx}
            source={type === "full" ? FULL_GLASS_IMG : HALF_GLASS_IMG}
            style={glassesList.length === 1 ? styles.bigGlassIcon : styles.rowGlassIcon}
            resizeMode="contain"
          />
        ))}
      </View>
    );
  };

  const handleLogWater = async () => {
    if (!userId) return;
    if (ml === 0) {
      showToast("Please add at least 125 ml of water to log.", "info");
      return;
    }

    setIsLogging(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];

      await logWater(userId, dateString, ml);
      
      // Mute notification reminders since user logged today's water
      checkAndSyncReminders(userId);
      
      showToast("Water intake logged successfully!", "success");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error logging water:", error);
      showToast("Could not log water. Please try again.", "error");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Water Intake</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.waterCard}>
          
          {/* Glasses Visual Representation */}
          <View style={styles.previewArea}>
            {renderGlasses()}
          </View>

          {/* Stepper Controls */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={[styles.stepperButton, ml <= 0 && styles.stepperButtonDisabled]} 
              onPress={handleDecrement}
              disabled={ml <= 0}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={28} color={ml <= 0 ? colors.textSecondary : colors.white} />
            </TouchableOpacity>

            <View style={styles.volumeDisplay}>
              <Text style={styles.volumeText}>{ml}</Text>
              <Text style={styles.volumeUnit}>ml</Text>
            </View>

            <TouchableOpacity 
              style={[styles.stepperButton, ml >= 1000 && styles.stepperButtonDisabled]} 
              onPress={handleIncrement}
              disabled={ml >= 1000}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color={ml >= 1000 ? colors.textSecondary : colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hintText}>
            1 Glass is approximately 250 ml. Max logging is 4 glasses (1000 ml) at a time.
          </Text>
        </View>
      </View>

      {/* Log Button */}
      <View style={styles.footer}>
        <AnimatedButton
          variant="primary"
          onPress={handleLogWater}
          loading={isLogging}
          style={styles.saveButton}
        >
          <Ionicons name="water-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>Log Hydration</Text>
        </AnimatedButton>
      </View>
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
  content: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  waterCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl,
    alignItems: "center", borderWidth: 1, borderColor: colors.border, ...shadows.md,
  },
  previewArea: {
    height: 180, justifyContent: "center", alignItems: "center", width: "100%",
    marginBottom: spacing.xxl,
  },
  bigGlassIcon: {
    width: 100, height: 150,
  },
  rowGlassIcon: {
    width: 50, height: 80,
  },
  glassesContainer: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center",
    gap: 12, width: "100%",
  },
  stepperContainer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.xxl, marginVertical: spacing.lg,
  },
  stepperButton: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#4DABF7",
    justifyContent: "center", alignItems: "center", ...shadows.sm,
  },
  stepperButtonDisabled: {
    backgroundColor: colors.border,
  },
  volumeDisplay: {
    alignItems: "center", width: 100,
  },
  volumeText: {
    fontSize: 36, fontWeight: "900", color: colors.textPrimary,
  },
  volumeUnit: {
    fontSize: 14, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase",
  },
  hintText: {
    fontSize: 12, color: colors.textSecondary, textAlign: "center", marginTop: spacing.md,
    lineHeight: 18, paddingHorizontal: spacing.md,
  },
  footer: { padding: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { backgroundColor: "#4DABF7" },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});

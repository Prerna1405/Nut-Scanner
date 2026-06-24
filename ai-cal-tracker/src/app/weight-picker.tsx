import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { RulerPicker } from "react-native-ruler-picker";
import { colors, spacing, borderRadius, shadows } from "../constants/Colors";
import { AnimatedButton } from "../components/AnimatedButton";
import { getUserProfileData, logWeight } from "../services/userService";

export default function WeightPickerScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ currentWeight?: string }>();
  
  const parsedWeight = params.currentWeight ? parseFloat(params.currentWeight) : 70;
  
  const [weight, setWeight] = useState<number>(parsedWeight);
  const [initialWeight, setInitialWeight] = useState<number>(parsedWeight);
  const [isLoading, setIsLoading] = useState(!params.currentWeight);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCurrentWeight() {
      if (!userId) return;
      try {
        const profile = await getUserProfileData(userId);
        if (profile?.weight) {
          // Only overwrite if we didn't get it from params, or if we want latest from DB
          if (!params.currentWeight) {
            setWeight(profile.weight);
            setInitialWeight(profile.weight);
          }
        }
      } catch (error) {
        console.error("Error loading current weight:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCurrentWeight();
  }, [userId, params.currentWeight]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];

      await logWeight(userId, weight, dateString);

      Alert.alert("Success", `Weight updated to ${weight} kg!`, [
        { text: "OK", onPress: () => router.replace("/(tabs)") }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update weight. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Weight</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.pickerCard}>
          <Text style={styles.title}>Adjust Your Weight</Text>
          <Text style={styles.subtitle}>Scroll the ruler to select your weight</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxl }} />
          ) : (
            <>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{weight}</Text>
                <Text style={styles.unitText}>kg</Text>
              </View>

              <View style={styles.pickerWrapper}>
                <RulerPicker
                  initialValue={initialWeight}
                  min={30}
                  max={250}
                  step={0.5}
                  fractionDigits={1}
                  unit="kg"
                  onValueChange={(val) => setWeight(parseFloat(val))}
                  width={300}
                  height={80}
                  indicatorColor={colors.primary}
                  indicatorHeight={40}
                  valueTextStyle={{ color: "transparent", fontSize: 0 }}
                  unitTextStyle={{ color: "transparent", fontSize: 0 }}
                />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <AnimatedButton
          variant="primary"
          onPress={handleSave}
          loading={isSaving}
          style={styles.saveButton}
        >
          <Text style={styles.saveBtnText}>Update Weight</Text>
        </AnimatedButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs, marginRight: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  pickerCard: {
    width: "100%",
    backgroundColor: colors.surface,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    ...shadows.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.xl,
  },
  valueText: {
    fontSize: 64,
    fontWeight: "bold",
    color: colors.primary,
  },
  unitText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  pickerWrapper: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    width: "100%",
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { borderRadius, spacing, shadows } from "../constants/Colors";

export default function PreferencesScreen() {
  const router = useRouter();
  const {
    colors,
    isDark,
    preference,
    setThemePreference,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useTheme();

  const themeOptions = [
    {
      id: "light",
      label: "Light Theme",
      desc: "Clean light backgrounds and crisp green accents",
      icon: "sunny-outline",
    },
    {
      id: "dark",
      label: "Dark Theme",
      desc: "Gentle dark palette designed for low-light environments",
      icon: "moon-outline",
    },
    {
      id: "system",
      label: "System Default",
      desc: "Matches your device's operating system setting",
      icon: "phone-portrait-outline",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Theme Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme Settings</Text>
          <View style={styles.optionsList}>
            {themeOptions.map((option) => {
              const isSelected = preference === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { borderWidth: 2 },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setThemePreference(option.id as any)}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.iconWrapper,
                        {
                          backgroundColor: isSelected
                            ? "rgba(41, 143, 80, 0.1)"
                            : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.02)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{option.label}</Text>
                      <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{option.desc}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notification Settings</Text>
          <View style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: notificationsEnabled ? "rgba(41, 143, 80, 0.1)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" },
                ]}
              >
                <Ionicons
                  name={notificationsEnabled ? "notifications-outline" : "notifications-off-outline"}
                  size={20}
                  color={notificationsEnabled ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Push Notifications</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Receive reminders to log your food, water, and workouts.
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
              thumbColor={notificationsEnabled ? colors.primary : "#9CA3AF"}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { borderRadius, spacing, shadows } from "../constants/Colors";

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last Updated: June 21, 2026</Text>

        <View style={styles.content}>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            AI Calorie Tracker is committed to protecting your privacy. This policy explains how we collect, process, and secure your personal details and fitness logs.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>1. Information We Collect</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            - **Profile Data**: When completing onboarding, we collect metrics like gender, fitness goals, workout frequency, birthdate, weight, and height.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            - **Nutrition & Health Logs**: We collect meal details, water intake logs, physical exercise logs, and historical weight logs entered into the app.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            - **Food Images**: Photos taken or uploaded for AI image analysis are processed securely using Google Gemini API to estimate calorie and macro targets.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>2. How We Process Data</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            All database writes are sent securely to Google Cloud Firebase Firestore and linked directly to your authenticated Clerk user ID. Photo scans are analyzed temporarily by Google's generative models and are not permanently cataloged or sold to third parties.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>3. Authentication Security</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            Identity authentication is powered by Clerk Auth. Clerk manages token storage, email verification, and OAuth integrations. We do not store passwords or direct payment information on our Firestore servers.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>4. Data Deletion Rights</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            You have the right to request deletion of your account and related fitness log documents in Firestore. Please send a data erasure request to ahireprerna05@gmail.com, and we will purge your user records within 30 days.
          </Text>

          <Text style={[styles.footerMessage, { color: colors.textSecondary }]}>
            Your trust is our priority. If you have any privacy concerns, reach out to us at ahireprerna05@gmail.com.
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.xl,
  },
  content: {
    gap: spacing.md,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  footerMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xl,
    fontStyle: "italic",
  },
});

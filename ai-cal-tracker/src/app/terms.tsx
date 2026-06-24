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

export default function TermsScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Terms of Service</Text>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last Updated: June 21, 2026</Text>

        <View style={styles.content}>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            Welcome to AI Calorie Tracker. By using our application, mobile app, or services, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before accessing the app.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            By creating an account or accessing the services, you represent that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease using the application.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>2. Medical Disclaimer</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            AI Calorie Tracker provides nutritional and workout estimation services, including recommendations generated using Artificial Intelligence (Gemini model).
          </Text>
          <View style={[styles.alertBox, { backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "#FFFBEB", borderColor: "rgba(245, 158, 11, 0.2)" }]}>
            <Ionicons name="warning" size={20} color="#D97706" style={{ marginRight: spacing.sm, marginTop: 2 }} />
            <Text style={[styles.alertText, { color: isDark ? "#FBBF24" : "#B45309" }]}>
              The suggestions, insights, and calculations provided by the AI Coach are for educational and motivational purposes only. They do not constitute professional medical advice, diagnosis, or treatment. Always consult a qualified physician or healthcare provider before beginning any new diet, caloric deficit plan, or exercise routine.
            </Text>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>3. User Accounts</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            You are responsible for safeguarding the credentials you use to access the app, and for any activities or actions conducted under your account. You agree not to disclose your password to any third party and to notify us immediately of any unauthorized security breach.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>4. Limitations of Liability</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            To the maximum extent permitted by law, AI Calorie Tracker and its creators shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services, including but not limited to physical health issues, errors in nutrition estimates, or data anomalies.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>5. Changes to the Agreement</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We reserve the right to revise or modify these Terms & Conditions at any time. Changes will be posted within this screen with an updated revision date. By continuing to use the app, you accept the modifications.
          </Text>

          <Text style={[styles.footerMessage, { color: colors.textSecondary }]}>
            If you have any questions or feedback regarding these terms, please contact support via the Profile screen or email us directly at ahireprerna05@gmail.com.
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
  alertBox: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  alertText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: "500",
  },
  footerMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xl,
    fontStyle: "italic",
  },
});

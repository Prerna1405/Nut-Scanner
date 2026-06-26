import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { borderRadius, spacing, shadows } from "../constants/Colors";
import { getAdminNotificationConfig, AdminNotificationConfig } from "../services/notificationService";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { AnimatedButton } from "../components/AnimatedButton";
import { checkIsAdmin } from "../services/userService";
import { useAuth, useUser } from "@clerk/clerk-expo";

export default function AdminScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { userId } = useAuth();
  const { user } = useUser();

  const [config, setConfig] = useState<AdminNotificationConfig>({
    lunch: { title: "Time for Lunch! 🥗", body: "Keep up your day streak! Log your lunch now." },
    afternoon: { title: "Afternoon Hydration Check 💧", body: "Stay energized! Don't forget to log some water." },
    dinner: { title: "Dinner & Exercise Check 🍳", body: "Wrap up your day! Log your dinner and exercise logs now." },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAndLoad() {
      if (!userId) {
        router.replace("/(tabs)");
        return;
      }

      // Check admin status
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const adminStatus = await checkIsAdmin(userId, userEmail);
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        setCheckingAdmin(false);
        return;
      }

      // If admin, load config
      try {
        const remoteConfig = await getAdminNotificationConfig();
        setConfig(remoteConfig);
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingAdmin(false);
      }
    }

    checkAndLoad();
  }, [userId, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "adminSettings", "notificationConfig"), config);
      alert("Notification messages saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save notification messages.");
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin: Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.scrollContent, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin: Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.scrollContent, { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl }]}>
          <Ionicons name="lock-closed-outline" size={80} color={colors.border} />
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.lg, textAlign: "center" }]}>
            You don't have access to this section.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin: Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Coach Logs Link */}
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => router.push('/admin-coach-logs')}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
            <Ionicons name="people" size={20} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 2 }]}>AI Coach Check-ins</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Review user AI coaching logs and missed targets</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        {/* Lunch Notification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Lunch Reminder</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              value={config.lunch.title}
              onChangeText={(text) => setConfig({ ...config, lunch: { ...config.lunch, title: text } })}
            />
            <Text style={[styles.label, { color: colors.textPrimary, marginTop: spacing.md }]}>Body</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
              value={config.lunch.body}
              onChangeText={(text) => setConfig({ ...config, lunch: { ...config.lunch, body: text } })}
              multiline
            />
          </View>
        </View>

        {/* Afternoon Notification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Afternoon Reminder</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              value={config.afternoon.title}
              onChangeText={(text) => setConfig({ ...config, afternoon: { ...config.afternoon, title: text } })}
            />
            <Text style={[styles.label, { color: colors.textPrimary, marginTop: spacing.md }]}>Body</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
              value={config.afternoon.body}
              onChangeText={(text) => setConfig({ ...config, afternoon: { ...config.afternoon, body: text } })}
              multiline
            />
          </View>
        </View>

        {/* Dinner Notification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Dinner Reminder</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              value={config.dinner.title}
              onChangeText={(text) => setConfig({ ...config, dinner: { ...config.dinner, title: text } })}
            />
            <Text style={[styles.label, { color: colors.textPrimary, marginTop: spacing.md }]}>Body</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
              value={config.dinner.body}
              onChangeText={(text) => setConfig({ ...config, dinner: { ...config.dinner, body: text } })}
              multiline
            />
          </View>
        </View>

        <AnimatedButton variant="primary" onPress={handleSave} loading={isSaving} style={{ marginTop: spacing.xl }}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </AnimatedButton>
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
  section: {
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
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

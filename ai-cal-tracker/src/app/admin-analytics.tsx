import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getAdminAnalytics, AdminStats } from "../services/adminAnalyticsService";
import { checkIsAdmin } from "../services/userService";
import { useAuth, useUser } from "@clerk/clerk-expo";

export default function AdminAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAndLoad = async () => {
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

      // If admin, load analytics
      try {
        const data = await getAdminAnalytics();
        setStats(data);
      } catch (error) {
        console.error("Failed to load admin analytics:", error);
      } finally {
        setCheckingAdmin(false);
        setLoading(false);
      }
    };

    checkAndLoad();
  }, [userId, user]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      textAlign: "center",
      marginRight: 40,
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    },
    content: {
      padding: 20,
    },
    adminBanner: {
      backgroundColor: colors.primary + "20",
      padding: 15,
      borderRadius: 12,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    adminText: {
      color: colors.primary,
      fontWeight: "600",
      marginLeft: 10,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 25,
    },
    statCard: {
      flex: 1,
      minWidth: 150,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
    },
    statIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    statValue: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 15,
    },
    usageItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    usageDate: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    usageUsers: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    noAccess: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    noAccessText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginTop: 15,
    },
  });

  if (checkingAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Analytics</Text>
        </View>
        <View style={[styles.content, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Analytics</Text>
        </View>
        <View style={styles.noAccess}>
          <Ionicons name="lock-closed-outline" size={80} color={colors.border} />
          <Text style={styles.noAccessText}>
            You don't have access to this section.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Analytics</Text>
        </View>
        <View style={[styles.content, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Analytics</Text>
      </View>
      <ScrollView style={styles.content}>
        {stats && (
          <>
            <View style={styles.adminBanner}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.adminText}>Admin Dashboard</Text>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color={colors.success}
                  />
                </View>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {stats.activeUsers7Days}
                </Text>
                <Text style={styles.statLabel}>Active (7d)</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="restaurant-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.statValue}>{stats.totalMealsLogged}</Text>
                <Text style={styles.statLabel}>Meals Logged</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="fitness-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.statValue}>
                  {stats.totalWorkoutsLogged}
                </Text>
                <Text style={styles.statLabel}>Workouts Logged</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="water-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.statValue}>
                  {Math.round(stats.totalWaterLogged / 1000)}L
                </Text>
                <Text style={styles.statLabel}>Water Logged</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="flame-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.statValue}>
                  {stats.averageDailyCalories}
                </Text>
                <Text style={styles.statLabel}>Avg Calories/Day</Text>
              </View>
            </View>

            {/* Usage Trends */}
            {stats.appUsageLast7Days.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Daily Usage (7 Days)</Text>
                {stats.appUsageLast7Days.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.usageItem,
                      index === stats.appUsageLast7Days.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text style={styles.usageDate}>{item.date}</Text>
                    <Text style={styles.usageUsers}>{item.users} users</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "@clerk/clerk-expo";
import { getWeeklyReportData, generateReportHTML } from "../services/weeklyReportService";
import { AnimatedButton } from "../components/AnimatedButton";

export default function WeeklyReportScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!user?.id) return;
      try {
        const data = await getWeeklyReportData(user.id);
        setReportData(data);
      } catch (error) {
        console.error("Failed to load weekly report:", error);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [user]);

  const handleViewReport = () => {
    if (!reportData) return;
    const html = generateReportHTML(
      reportData,
      user?.fullName || user?.username || "User"
    );
    
    // Create a data URL for the HTML
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    
    if (Platform.OS === "web") {
      // On web, open in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    } else {
      // For native, could use expo-print or other library
      alert("Report generation is available on web.");
    }
  };

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
    dateRange: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 25,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 30,
    },
    summaryCard: {
      flex: 1,
      minWidth: 150,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
    },
    summaryValue: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.primary,
      marginBottom: 5,
    },
    summaryLabel: {
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
    dailyItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dailyDate: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    dailyStats: {
      flexDirection: "row",
      gap: 15,
    },
    dailyStat: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    buttonContainer: {
      marginTop: 30,
    },
    emptyState: {
      textAlign: "center",
      color: colors.textSecondary,
      paddingVertical: 50,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Report</Text>
        </View>
        <View style={[styles.content, { flex: 1, justifyContent: "center" }]}>
          <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
            Loading report...
          </Text>
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
        <Text style={styles.headerTitle}>Weekly Report</Text>
      </View>
      <ScrollView style={styles.content}>
        {reportData && (
          <>
            <Text style={styles.dateRange}>
              {reportData.startDate} – {reportData.endDate}
            </Text>

            {/* Summary Grid */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {reportData.totalCalories}
                </Text>
                <Text style={styles.summaryLabel}>Total Calories</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {(reportData.totalWaterMl / 1000).toFixed(1)}L
                </Text>
                <Text style={styles.summaryLabel}>Total Water</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {reportData.totalWorkouts}
                </Text>
                <Text style={styles.summaryLabel}>Total Workouts</Text>
              </View>
            </View>

            {/* Daily Breakdown */}
            <Text style={styles.sectionTitle}>Daily Breakdown</Text>
            {reportData.dailyData.length > 0 ? (
              reportData.dailyData.map((day: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dailyItem,
                    index === reportData.dailyData.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <Text style={styles.dailyDate}>{day.date}</Text>
                  <View style={styles.dailyStats}>
                    <Text style={styles.dailyStat}>{day.calories} kcal</Text>
                    <Text style={styles.dailyStat}>
                      {(day.waterMl / 1000).toFixed(1)}L
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>
                No data for this week yet. Log some meals and workouts!
              </Text>
            )}

            {/* View Report Button */}
            <View style={styles.buttonContainer}>
              <AnimatedButton onPress={handleViewReport}>
                <Text style={{ color: "white", fontWeight: "600" }}>
                  View Full Report
                </Text>
              </AnimatedButton>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

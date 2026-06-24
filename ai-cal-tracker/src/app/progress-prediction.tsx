import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "@clerk/clerk-expo";
import { getWeightHistory } from "../services/userService";
import { predictProgress } from "../services/progressPredictionService";

export default function ProgressPredictionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const history = await getWeightHistory(user.id);
        setWeightHistory(history);
        const pred = predictProgress(history, []);
        setPrediction(pred);
      } catch (error) {
        console.error("Failed to load progress prediction:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "losing":
        return colors.success;
      case "gaining":
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case "losing":
        return "Losing Weight";
      case "gaining":
        return "Gaining Weight";
      default:
        return "Stable";
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
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 15,
    },
    currentWeight: {
      fontSize: 36,
      fontWeight: "800",
      color: colors.primary,
      marginBottom: 5,
    },
    currentWeightLabel: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    trendIcon: {
      marginRight: 10,
    },
    trendText: {
      fontSize: 18,
      fontWeight: "600",
    },
    weeklyChange: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
    },
    predictionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    predictionItem: {
      flex: 1,
      minWidth: 150,
      backgroundColor: colors.background,
      padding: 15,
      borderRadius: 12,
    },
    predictionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    predictionValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    confidenceContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      padding: 10,
      backgroundColor: colors.primary + "10",
      borderRadius: 10,
    },
    confidenceText: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 8,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 15,
    },
    historyItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyDate: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    historyWeight: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    emptyState: {
      textAlign: "center",
      color: colors.textSecondary,
      paddingVertical: 30,
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
          <Text style={styles.headerTitle}>Progress Prediction</Text>
        </View>
        <View style={[styles.content, { flex: 1, justifyContent: "center" }]}>
          <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
            Loading...
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
        <Text style={styles.headerTitle}>Progress Prediction</Text>
      </View>
      <ScrollView style={styles.content}>
        {prediction && (
          <>
            {/* Current Weight & Trend */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Status</Text>
              <Text style={styles.currentWeight}>
                {prediction.currentWeight.toFixed(1)} kg
              </Text>
              <Text style={styles.currentWeightLabel}>Current Weight</Text>
              <View style={styles.trendContainer}>
                <Ionicons
                  name={
                    prediction.trend === "losing"
                      ? "trending-down-outline"
                      : prediction.trend === "gaining"
                      ? "trending-up-outline"
                      : "remove-outline"
                  }
                  size={28}
                  color={getTrendColor(prediction.trend)}
                  style={styles.trendIcon}
                />
                <Text
                  style={[
                    styles.trendText,
                    { color: getTrendColor(prediction.trend) },
                  ]}
                >
                  {getTrendText(prediction.trend)}
                </Text>
              </View>
              <Text style={styles.weeklyChange}>
                Weekly change: {prediction.averageWeightChangePerWeek.toFixed(2)}{" "}
                kg
              </Text>
              <View style={styles.confidenceContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.confidenceText}>
                  Confidence: {prediction.confidence}
                </Text>
              </View>
            </View>

            {/* Predictions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Future Projections</Text>
              <View style={styles.predictionsGrid}>
                <View style={styles.predictionItem}>
                  <Text style={styles.predictionLabel}>In 4 Weeks</Text>
                  <Text style={styles.predictionValue}>
                    {prediction.projectedWeightIn4Weeks.toFixed(1)} kg
                  </Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={styles.predictionLabel}>In 8 Weeks</Text>
                  <Text style={styles.predictionValue}>
                    {prediction.projectedWeightIn8Weeks.toFixed(1)} kg
                  </Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={styles.predictionLabel}>In 12 Weeks</Text>
                  <Text style={styles.predictionValue}>
                    {prediction.projectedWeightIn12Weeks.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            </View>

            {/* History */}
            {weightHistory.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.historyTitle}>Weight History</Text>
                {weightHistory.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.historyItem,
                      index === weightHistory.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyWeight}>
                      {item.weight.toFixed(1)} kg
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {weightHistory.length < 2 && (
              <View style={styles.card}>
                <Text style={styles.emptyState}>
                  Log more weight entries for better predictions!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

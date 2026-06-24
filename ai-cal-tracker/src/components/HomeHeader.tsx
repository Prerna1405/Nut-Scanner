import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, spacing } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

export function HomeHeader() {
  const { user } = useUser();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const firstName = user?.firstName || "Fitness Friend";
  const avatarUrl = user?.imageUrl;

  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Welcome back, 👋</Text>
          <Text style={styles.userName}>{firstName}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.notificationButton} 
        activeOpacity={0.7}
        onPress={() => {
          Alert.alert("Notifications", "Notification feature coming soon!");
        }}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(41, 143, 80, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(41, 143, 80, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeTextContainer: {
    marginLeft: spacing.sm,
  },
  welcomeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});

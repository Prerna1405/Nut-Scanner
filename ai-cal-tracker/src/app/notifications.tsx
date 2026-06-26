import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";

interface NotificationItem {
  id: string;
  type: "pantry" | "meal" | "goal" | "achievement";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "pantry",
    title: "Expiry Warning",
    message: "Chicken Breast expires in 1 day!",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "goal",
    title: "Goal Progress",
    message: "You're 80% to your weekly calorie goal!",
    time: "Yesterday",
    read: false,
  },
  {
    id: "3",
    type: "achievement",
    title: "Achievement Unlocked",
    message: "You logged 7 days in a row!",
    time: "3 days ago",
    read: true,
  },
  {
    id: "4",
    type: "meal",
    title: "Meal Reminder",
    message: "Don't forget to log your dinner!",
    time: "1 week ago",
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, read: true }))
    );
  };

  const getIconForType = (type: NotificationItem["type"]) => {
    switch (type) {
      case "pantry":
        return "cube-outline";
      case "meal":
        return "restaurant-outline";
      case "goal":
        return "trending-up-outline";
      case "achievement":
        return "trophy-outline";
      default:
        return "notifications-outline";
    }
  };

  const getColorForType = (type: NotificationItem["type"]) => {
    switch (type) {
      case "pantry":
        return colors.error;
      case "goal":
        return colors.primary;
      case "achievement":
        return "#FFD700";
      case "meal":
        return "#FF6B6B";
      default:
        return colors.textSecondary;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    markAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    markAllText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    notificationCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      gap: 12,
    },
    notificationCardUnread: {
      borderColor: colors.primary,
      backgroundColor: "rgba(41, 143, 80, 0.05)",
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    contentContainer: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    message: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 6,
    },
    time: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View
              style={{
                marginLeft: 8,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${getColorForType(notification.type)}20` },
                ]}
              >
                <Ionicons
                  name={getIconForType(notification.type)}
                  size={20}
                  color={getColorForType(notification.type)}
                />
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.message}>{notification.message}</Text>
                <Text style={styles.time}>{notification.time}</Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>No notifications yet!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, spacing, shadows } from "../../constants/Colors";
import { checkIsAdmin } from "../../services/userService";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (userId) {
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        const adminStatus = await checkIsAdmin(userId, userEmail);
        setIsAdmin(adminStatus);
      }
      setLoadingAdmin(false);
    };
    checkAdmin();
  }, [userId, user]);

  const userAvatar = user?.imageUrl;
  const fullName = user?.fullName || "Fitness Enthusiast";
  const emailAddress = user?.primaryEmailAddress?.emailAddress || "Sign in to manage goals";

  const handleContactUs = () => {
    const email = "ahireprerna05@gmail.com";
    const subject = encodeURIComponent("AI Calorie Tracker - Support Request");
    const body = encodeURIComponent(
      `Hello Support Team,\n\n[Please describe your query or issue here]\n\n---\nApp Details:\n- App Name: AI Calorie Tracker\n- Platform: ${Platform.OS === "web" ? "Web Browser" : Platform.OS}\n- User Name: ${fullName}\n- User Email: ${emailAddress}\n`
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch((err) => {
      console.error("Failed to open email app:", err);
      alert("Could not open default email app. Please send an email manually to: " + email);
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Failed to sign out:", err);
      alert("An error occurred during logout. Please try again.");
    }
  };

  const menuSections = [
    {
      title: "Goals & Health",
      items: [
        {
          label: "Personal Details",
          icon: "person-outline",
          color: colors.primary,
          onPress: () => router.push("/personal-details"),
        },
        {
          label: "Health Score",
          icon: "heart-outline",
          color: colors.primary,
          onPress: () => router.push("/health-score"),
        },
        {
          label: "Weekly Report",
          icon: "document-text-outline",
          color: colors.primary,
          onPress: () => router.push("/weekly-report"),
        },
      ],
    },
    {
      title: "AI & Insights",
      items: [
        {
          label: "AI Nutrition Coach",
          icon: "chatbubbles-outline",
          color: "#2563EB", // blue
          onPress: () => router.push("/nutrition-coach"),
        },
        {
          label: "Progress Prediction",
          icon: "trending-up-outline",
          color: "#10B981", // green
          onPress: () => router.push("/progress-prediction"),
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          label: "Barcode Scanner",
          icon: "barcode-outline",
          color: "#F59E0B", // amber
          onPress: () => router.push("/barcode-scanner"),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Preferences",
          icon: "settings-outline",
          color: "#8B5CF6", // purple accent
          onPress: () => router.push("/preferences"),
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          label: "Notification Settings",
          icon: "construct-outline",
          color: "#F97316", // orange accent
          onPress: () => router.push("/admin"),
        },
        {
          label: "Admin Analytics",
          icon: "analytics-outline",
          color: "#DC2626", // red
          onPress: () => router.push("/admin-analytics"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Request New Feature",
          icon: "sparkles-outline",
          color: "#F59E0B", // amber accent
          onPress: () => router.push("/request-feature"),
        },
        {
          label: "Contact Us",
          icon: "mail-outline",
          color: "#3B82F6", // blue accent
          onPress: handleContactUs,
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          label: "Terms & Conditions",
          icon: "document-text-outline",
          color: "#6B7280", // gray accent
          onPress: () => router.push("/terms"),
        },
        {
          label: "Privacy Policy",
          icon: "shield-checkmark-outline",
          color: "#10B981", // green accent
          onPress: () => router.push("/privacy"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={[styles.avatar, { borderColor: colors.primary }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? "rgba(41, 143, 80, 0.15)" : "rgba(41, 143, 80, 0.08)", borderColor: colors.border }]}>
              <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{fullName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{emailAddress}</Text>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => {
          // Skip Admin section if user isn't admin
          if (section.title === "Admin" && !isAdmin) {
            return null;
          }
          
          return (
            <View key={sIdx} style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={iIdx}
                    style={[
                      styles.menuItem,
                      iIdx < section.items.length - 1 && [styles.borderBottom, { borderBottomColor: colors.border }],
                    ]}
                    activeOpacity={0.7}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconWrapper, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2", borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)" }]}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: spacing.sm }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version Info */}
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          AI Calorie Tracker v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120, // Add padding for bottom navigation bar
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    borderWidth: 3,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "bold",
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.md,
    opacity: 0.6,
  },
});

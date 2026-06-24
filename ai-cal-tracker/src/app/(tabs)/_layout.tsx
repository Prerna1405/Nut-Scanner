import React, { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { Platform, View, TouchableOpacity, StyleSheet, Modal, Text, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shadows, borderRadius, spacing } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

function CustomTabBarButton({ children, onMenuToggle }: any) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      style={styles.customButtonContainer}
      onPress={onMenuToggle}
      activeOpacity={0.8}
    >
      <View style={styles.customButtonInner}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isScanModalVisible, setIsScanModalVisible] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const handleMenuOption = (route: string) => {
    setIsMenuVisible(false);
    if (route) {
      router.push(route as any);
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const { status: requestStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (requestStatus !== 'granted') {
          alert('Camera permission is required to take a picture.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsScanModalVisible(false);
        router.push({
          pathname: '/scan-analysis',
          params: { imageUri: result.assets[0].uri }
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("An error occurred while launching the camera.");
    }
  };

  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsScanModalVisible(false);
        router.push({
          pathname: '/scan-analysis',
          params: { imageUri: result.assets[0].uri }
        });
      }
    } catch (error) {
      console.error("Gallery error:", error);
      alert("An error occurred while opening the gallery.");
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            position: "absolute",
            bottom: Platform.OS === "ios" ? 30 : 20,
            left: 20,
            right: 20,
            height: 64,
            backgroundColor: colors.surface,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: "rgba(41, 143, 80, 0.1)",
            ...shadows.lg,
            paddingBottom: 0, // fixes internal padding on some devices
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarButton: (props) => (
              <CustomTabBarButton {...props} onMenuToggle={() => setIsMenuVisible(true)}>
                <Ionicons name="add" size={32} color="#fff" />
              </CustomTabBarButton>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.menuContainer}>
                
                <View style={styles.menuGrid}>
                  {/* Option 1: Log Exercise */}
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => handleMenuOption('/log-exercise')}>
                    <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                      <Ionicons name="barbell" size={28} color="#FF6B6B" />
                    </View>
                    <Text style={styles.menuItemText}>Log Exercise</Text>
                  </TouchableOpacity>

                  {/* Option 2: Add Drink Water */}
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => handleMenuOption('/log-water')}>
                    <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(77, 171, 247, 0.1)' }]}>
                      <Ionicons name="water" size={28} color="#4DABF7" />
                    </View>
                    <Text style={styles.menuItemText}>Drink Water</Text>
                  </TouchableOpacity>

                  {/* Option 3: Food Database */}
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => handleMenuOption('/food-search')}>
                    <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(41, 143, 80, 0.1)' }]}>
                      <Ionicons name="restaurant" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.menuItemText}>Food Database</Text>
                  </TouchableOpacity>

                  {/* Option 4: Scan Food */}
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => {
                    setIsMenuVisible(false);
                    setIsScanModalVisible(true);
                  }}>
                    <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(252, 196, 25, 0.1)' }]}>
                      <Ionicons name="barcode" size={28} color="#FCC419" />
                    </View>
                    <Text style={styles.menuItemText}>Scan Food</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Scan Food Choice Modal */}
      <Modal
        visible={isScanModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsScanModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsScanModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.scanDialogContainer}>
                <Text style={styles.scanDialogTitle}>Scan Food</Text>
                <Text style={styles.scanDialogSubtitle}>Choose how you'd like to import the food image</Text>

                <TouchableOpacity
                  style={styles.scanOptionButton}
                  activeOpacity={0.7}
                  onPress={handleCamera}
                >
                  <View style={[styles.scanIconWrapper, { backgroundColor: 'rgba(41, 143, 80, 0.1)' }]}>
                    <Ionicons name="camera" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.scanOptionTextWrapper}>
                    <Text style={styles.scanOptionTitle}>Take a Picture</Text>
                    <Text style={styles.scanOptionDesc}>Use your camera to capture food details</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.scanOptionButton}
                  activeOpacity={0.7}
                  onPress={handleGallery}
                >
                  <View style={[styles.scanIconWrapper, { backgroundColor: 'rgba(77, 171, 247, 0.1)' }]}>
                    <Ionicons name="images" size={24} color="#4DABF7" />
                  </View>
                  <View style={styles.scanOptionTextWrapper}>
                    <Text style={styles.scanOptionTitle}>Upload from Gallery</Text>
                    <Text style={styles.scanOptionDesc}>Select an image from your library</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.7}
                  onPress={() => setIsScanModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  customButtonContainer: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
  customButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  menuContainer: {
    width: "85%",
    marginBottom: Platform.OS === "ios" ? 120 : 100, // Positions it just above the tab bar
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  menuItem: {
    width: "47%", // slightly under 50% to account for gap
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  menuIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scanDialogContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
  scanDialogTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scanDialogSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  scanOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  scanIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  scanOptionTextWrapper: {
    flex: 1,
  },
  scanOptionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  scanOptionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});

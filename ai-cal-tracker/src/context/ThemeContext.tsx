import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import { getUserPreferences, saveUserPreferences } from "../services/userService";
import { lightColors, darkColors } from "../constants/Colors";
import { checkAndSyncReminders, requestNotificationPermissions, cancelAllReminders } from "../services/notificationService";

type ThemePreference = "system" | "light" | "dark";
type ActiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: ActiveTheme;
  preference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  colors: typeof lightColors;
  isDark: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const systemScheme = useColorScheme();
  
  const [preference, setPreference] = useState<ThemePreference>("light");
  const [notificationsEnabled, setNotificationsState] = useState<boolean>(true);
  const [resolvedTheme, setResolvedTheme] = useState<ActiveTheme>("light");

  // Load preferences from cache or Firestore
  useEffect(() => {
    async function loadPreferences() {
      // 1. Try local storage first for quick response
      let localTheme: string | null = null;
      let localNotif: string | null = null;
      try {
        localTheme = await AsyncStorage.getItem("theme_preference");
        localNotif = await AsyncStorage.getItem("notifications_enabled");
      } catch (err) {
        console.error("Error reading local preferences:", err);
      }

      if (localTheme) {
        setPreference(localTheme as ThemePreference);
      }
      if (localNotif) {
        setNotificationsState(localNotif === "true");
      }

      // 2. If user is logged in, sync from Firestore
      if (userId) {
        try {
          const remotePref = await getUserPreferences(userId);
          if (remotePref) {
            setPreference(remotePref.theme);
            setNotificationsState(remotePref.notificationsEnabled);
            await AsyncStorage.setItem("theme_preference", remotePref.theme);
            await AsyncStorage.setItem("notifications_enabled", remotePref.notificationsEnabled ? "true" : "false");
            await checkAndSyncReminders(userId);
          } else {
            await checkAndSyncReminders(userId);
          }
        } catch (err) {
          console.error("Error loading remote preferences:", err);
          await checkAndSyncReminders(userId);
        }
      } else {
        await cancelAllReminders();
      }
    }

    loadPreferences();
  }, [userId]);

  // Resolve dynamic active theme
  useEffect(() => {
    if (preference === "system") {
      setResolvedTheme(systemScheme === "dark" ? "dark" : "light");
    } else {
      setResolvedTheme(preference);
    }
  }, [preference, systemScheme]);

  const setThemePreference = async (pref: ThemePreference) => {
    setPreference(pref);
    try {
      await AsyncStorage.setItem("theme_preference", pref);
      if (userId) {
        await saveUserPreferences(userId, {
          theme: pref,
          notificationsEnabled,
        });
      }
    } catch (err) {
      console.error("Error saving theme preference:", err);
    }
  };

  const setNotificationsEnabled = async (enabled: boolean) => {
    let finalEnabled = enabled;
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        alert("Notification permission is required to enable reminders. Please enable them in your device settings.");
        finalEnabled = false;
      }
    }

    setNotificationsState(finalEnabled);
    try {
      await AsyncStorage.setItem("notifications_enabled", finalEnabled ? "true" : "false");
      if (userId) {
        await saveUserPreferences(userId, {
          theme: preference,
          notificationsEnabled: finalEnabled,
        });
        await checkAndSyncReminders(userId);
      } else {
        if (!finalEnabled) {
          await cancelAllReminders();
        }
      }
    } catch (err) {
      console.error("Error saving notifications preference:", err);
    }
  };

  const activeColors = resolvedTheme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        preference,
        setThemePreference,
        colors: activeColors,
        isDark: resolvedTheme === "dark",
        notificationsEnabled,
        setNotificationsEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

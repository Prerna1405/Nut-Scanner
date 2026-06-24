import * as Notifications from "expo-notifications";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getDailyLog } from "./userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Configure Expo notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationMsg {
  title: string;
  body: string;
}

export interface AdminNotificationConfig {
  lunch: NotificationMsg;
  afternoon: NotificationMsg;
  dinner: NotificationMsg;
}

const DEFAULT_CONFIG: AdminNotificationConfig = {
  lunch: {
    title: "Time for Lunch! 🥗",
    body: "Keep up your day streak! Log your lunch now.",
  },
  afternoon: {
    title: "Afternoon Hydration Check 💧",
    body: "Stay energized! Don't forget to log some water.",
  },
  dinner: {
    title: "Dinner & Exercise Check 🍳",
    body: "Wrap up your day! Log your dinner and exercise logs now.",
  },
};

/**
 * Fetches the notifications message template from the admin collection in Firestore.
 * Automatically seeds the document with defaults if it doesn't exist.
 */
export async function getAdminNotificationConfig(): Promise<AdminNotificationConfig> {
  try {
    const docRef = doc(db, "adminSettings", "notificationConfig");
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data() as AdminNotificationConfig;
    } else {
      // Seed default config into Firestore so it exists
      await setDoc(docRef, DEFAULT_CONFIG);
      console.log("[Firebase Sync] Seeded default notification config to adminSettings/notificationConfig.");
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error("[Firebase Sync] Error fetching admin notification config:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Requests device permissions to send notifications.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (error) {
    console.error("[Notification Service] Error requesting permissions:", error);
    return false;
  }
}

/**
 * Schedules daily reminder notifications for Lunch (1:00 PM), Afternoon (5:00 PM), and Dinner (8:30 PM).
 */
export async function scheduleDailyReminders() {
  if (Platform.OS === "web") return;
  try {
    // 1. Cancel existing notifications first to prevent duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. Fetch templates
    const config = await getAdminNotificationConfig();

    // 3. Schedule daily lunch reminder (13:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.lunch.title,
        body: config.lunch.body,
        sound: true,
      },
      trigger: {
        hour: 13,
        minute: 0,
        repeats: true,
      } as any,
    });

    // 4. Schedule daily afternoon reminder (17:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.afternoon.title,
        body: config.afternoon.body,
        sound: true,
      },
      trigger: {
        hour: 17,
        minute: 0,
        repeats: true,
      } as any,
    });

    // 5. Schedule daily dinner reminder (20:30)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.dinner.title,
        body: config.dinner.body,
        sound: true,
      },
      trigger: {
        hour: 20,
        minute: 30,
        repeats: true,
      } as any,
    });

    console.log("[Notification Service] Successfully scheduled daily reminders for Lunch, Afternoon, and Dinner.");
  } catch (error) {
    console.error("[Notification Service] Error scheduling reminders:", error);
  }
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllReminders() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("[Notification Service] Canceled all scheduled notifications.");
  } catch (error) {
    console.error("[Notification Service] Error canceling notifications:", error);
  }
}

/**
 * Syncs the notification schedule based on:
 * - If notifications are disabled in preferences, clear all reminders.
 * - If notifications are enabled, check if the user has logged any activity today.
 *   - If activity exists today, cancel reminders (to prevent redundant notifications today).
 *   - If no activity exists today, schedule the reminders.
 */
export async function checkAndSyncReminders(userId: string | null | undefined) {
  if (!userId || Platform.OS === "web") return;
  
  try {
    // 1. Check local notification setting
    const setting = await AsyncStorage.getItem("notifications_enabled");
    const notificationsEnabled = setting === null ? true : setting === "true";

    if (!notificationsEnabled) {
      await cancelAllReminders();
      return;
    }

    // 2. Fetch today's log to see if any activity is recorded
    const offset = new Date().getTimezoneOffset();
    const today = new Date(new Date().getTime() - (offset * 60 * 1000));
    const dateStr = today.toISOString().split("T")[0];
    
    const dailyLog = await getDailyLog(userId, dateStr);
    
    const hasLoggedActivity = !!dailyLog && (
      (dailyLog.meals?.length ?? 0) > 0 ||
      (dailyLog.workouts?.length ?? 0) > 0 ||
      (dailyLog.consumedWater ?? 0) > 0
    );

    if (hasLoggedActivity) {
      // User has logged activity today, clear reminders so they aren't bothered today
      await cancelAllReminders();
      console.log("[Notification Service] Activity detected for today. Muting reminders.");
    } else {
      // User forgot to log activity today, schedule reminders
      await scheduleDailyReminders();
      console.log("[Notification Service] No activity detected today. Scheduling daily reminders.");
    }
  } catch (error) {
    console.error("[Notification Service] Error in checkAndSyncReminders:", error);
  }
}

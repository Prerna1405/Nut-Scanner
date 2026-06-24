import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { View, Text, SafeAreaView, StyleSheet, StatusBar, Platform, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { tokenCache } from "../config/tokenCache";
import { useSyncUser } from "../hooks/useSyncUser";
import { colors, borderRadius, spacing, shadows } from "../constants/Colors";
import { ThemeProvider } from "../context/ThemeContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/Toast';

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

// Polyfill setNativeProps for Web DOM elements to support react-native-ruler-picker on Web
if (Platform.OS === "web") {
  if (typeof Element !== "undefined" && !(Element.prototype as any).setNativeProps) {
    (Element.prototype as any).setNativeProps = function (props: any) {
      if (!props) return;
      if (
        "text" in props &&
        (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement)
      ) {
        this.value = props.text;
        const event = new Event("input", { bubbles: true });
        this.dispatchEvent(event);
      }
      if ("style" in props && props.style) {
        Object.assign(this.style, props.style);
      }
      for (const key in props) {
        if (key !== "text" && key !== "style") {
          this.setAttribute(key, props[key]);
        }
      }
    };
  }
}


function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Automatically sync user metadata to Firestore when signed in and get onboarding status
  const { isOnboarded } = useSyncUser();

  useEffect(() => {
    if (!isLoaded) return;

    // Save sign-in status to local storage (localStorage on web, SecureStore on native mobile)
    if (Platform.OS === "web") {
      try {
        localStorage.setItem("user_signed_in", isSignedIn ? "true" : "false");
      } catch (err) {
        console.error("Failed to save sign-in state to localStorage:", err);
      }
    } else {
      SecureStore.setItemAsync("user_signed_in", isSignedIn ? "true" : "false").catch((err) => {
        console.error("Failed to save sign-in state to SecureStore:", err);
      });
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (isSignedIn) {
      if (isOnboarded === null) {
        // Still checking onboarding status, delay routing
        return;
      }

      if (!isOnboarded && !inOnboarding) {
        // Authenticated but onboarding not completed
        router.replace("/onboarding");
      } else if (isOnboarded && (inAuthGroup || inOnboarding)) {
        // Authenticated and onboarding completed, redirect to home dashboard
        router.replace("/(tabs)" as any);
      }
    } else if (!isSignedIn && !inAuthGroup) {
      // Redirect unauthenticated users to the Sign In screen
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, isLoaded, segments, isOnboarded]);

  // Prevent flicker by showing a beautiful loader while Clerk session or onboarding status is being checked
  if (!isLoaded || (isSignedIn && isOnboarded === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="generate-plan" />
      <Stack.Screen name="(auth)/sign-in" />
      <Stack.Screen name="(auth)/sign-up" />
      <Stack.Screen name="log-exercise" />
      <Stack.Screen name="workout-form" />
      <Stack.Screen name="workout-result" />
      <Stack.Screen name="workout-manual" />
      <Stack.Screen name="log-water" />
      <Stack.Screen name="food-search" />
      <Stack.Screen name="scan-analysis" />
      <Stack.Screen name="scan-result" />
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="request-feature" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}

function ConfigErrorScreen() {
  return (
    <SafeAreaView style={styles.errorContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.errorContent}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>SETUP REQUIRED</Text>
        </View>
        <Text style={styles.errorTitle}>Configuration Required</Text>
        <Text style={styles.errorDesc}>
          To run the app, you must set up your environment variables.
        </Text>
        
        <View style={styles.stepsCard}>
          <Text style={styles.stepTitle}>Next Steps:</Text>
          
          <Text style={styles.stepItem}>
            <Text style={styles.stepNumber}>1. </Text>
            Copy <Text style={styles.codeText}>.env.example</Text> to <Text style={styles.codeText}>.env</Text> in the project root folder.
          </Text>
          
          <Text style={styles.stepItem}>
            <Text style={styles.stepNumber}>2. </Text>
            Add your Clerk <Text style={styles.strongText}>Publishable Key</Text> to <Text style={styles.codeText}>EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text>.
          </Text>

          <Text style={styles.stepItem}>
            <Text style={styles.stepNumber}>3. </Text>
            Add your Firebase project keys to the respective environment variables.
          </Text>

          <Text style={styles.stepItem}>
            <Text style={styles.stepNumber}>4. </Text>
            Restart your Metro bundler server (<Text style={styles.codeText}>npm start</Text>).
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  if (!publishableKey) {
    return <ConfigErrorScreen />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={Platform.OS !== "web" ? tokenCache : undefined}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              {Platform.OS === "web" && (
                // @ts-ignore
                <div id="clerk-captcha" />
              )}
              <InitialLayout />
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContent: {
    paddingHorizontal: spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  badgeContainer: {
    backgroundColor: "rgba(41, 143, 80, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(41, 143, 80, 0.25)",
    borderRadius: borderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  errorDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    width: "100%",
    ...shadows.md,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  stepItem: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  stepNumber: {
    color: colors.primary,
    fontWeight: "bold",
  },
  codeText: {
    color: colors.primaryLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "600",
  },
  strongText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});

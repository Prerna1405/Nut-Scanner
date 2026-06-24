import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, shadows } from "../../constants/Colors";
import { AnimatedButton } from "../../components/AnimatedButton";

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password: password,
      });

      // Set active session
      await setActive({ session: completeSignIn.createdSessionId });
      router.replace("/");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage(
        err.errors?.[0]?.message || "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignInPress = useCallback(async () => {
    setOauthLoading(true);
    setErrorMessage("");
    try {
      const redirectUrl = Linking.createURL("/oauth-callback", {
        scheme: "aicaltracker",
      });

      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      console.error("Google OAuth error", err);
      setErrorMessage(
        err.errors?.[0]?.message || "Google Authentication failed. Please try again."
      );
    } finally {
      setOauthLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoBackground}>
              <Image
                source={require("../../../assets/images/logo-glow.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>AI Calorie</Text>
            <Text style={styles.subtitle}>
              Track your nutrition. Achieve your health goals.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                isEmailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={isEmailFocused ? colors.primary : colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                style={styles.input}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Text style={styles.forgotText}>Forgot?</Text>
              </Link>
            </View>
            <View
              style={[
                styles.inputWrapper,
                isPasswordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isPasswordFocused ? colors.primary : colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                style={styles.input}
              />
              <Link href="/(auth)/sign-in" asChild>
                <Text
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Text>
              </Link>
            </View>

            {/* Action Button */}
            <AnimatedButton
              variant="primary"
              onPress={onSignInPress}
              loading={isLoading}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </AnimatedButton>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Authentication */}
            <AnimatedButton
              variant="outline"
              onPress={onGoogleSignInPress}
              loading={oauthLoading}
              style={styles.googleButton}
            >
              <View style={styles.googleButtonContent}>
                <Ionicons
                  name="logo-google"
                  size={18}
                  color={colors.textPrimary}
                  style={styles.socialIcon}
                />
                <Text style={styles.googleButtonText}>Sign In with Google</Text>
              </View>
            </AnimatedButton>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  logoBackground: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(41, 143, 80, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(41, 143, 80, 0.15)",
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginLeft: spacing.sm,
    flex: 1,
  },
  inputLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  forgotText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
    marginBottom: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.surface,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    height: "100%",
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  primaryButton: {
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    borderColor: colors.border,
    height: 52,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
});

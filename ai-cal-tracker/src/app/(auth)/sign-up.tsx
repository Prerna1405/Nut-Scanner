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
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, shadows } from "../../constants/Colors";
import { AnimatedButton } from "../../components/AnimatedButton";
import { saveUserToFirebase } from "../../services/userService";

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification states
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Loading and Error states
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Focus states
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage(
        err.errors?.[0]?.message || "Something went wrong. Please check your inputs."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    if (!verificationCode) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        try {
          await saveUserToFirebase({
            id: completeSignUp.createdUserId!,
            emailAddress: email,
            firstName: firstName,
            lastName: lastName,
          });
        } catch (dbErr) {
          console.error("Firestore sync fallback failed during sign up verification:", dbErr);
        }
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        setErrorMessage("Verification could not be completed. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage(
        err.errors?.[0]?.message || "Invalid verification code. Please check and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignUpPress = useCallback(async () => {
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
      console.error("Google OAuth Sign Up error", err);
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
              Join us to track and transform your fitness journey.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {!pendingVerification ? (
              // Sign Up Form Area
              <View>
                <Text style={styles.cardTitle}>Create Account</Text>

                {/* Name inputs in a row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputHalf, { marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        isFirstNameFocused && styles.inputWrapperFocused,
                      ]}
                    >
                      <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="John"
                        placeholderTextColor={colors.textSecondary}
                        onFocus={() => setIsFirstNameFocused(true)}
                        onBlur={() => setIsFirstNameFocused(false)}
                        style={styles.input}
                      />
                    </View>
                  </View>
                  <View style={[styles.inputHalf, { marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        isLastNameFocused && styles.inputWrapperFocused,
                      ]}
                    >
                      <TextInput
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Doe"
                        placeholderTextColor={colors.textSecondary}
                        onFocus={() => setIsLastNameFocused(true)}
                        onBlur={() => setIsLastNameFocused(false)}
                        style={styles.input}
                      />
                    </View>
                  </View>
                </View>

                {/* Email Field */}
                <Text style={styles.inputLabel}>Email Address</Text>
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
                    placeholder="john.doe@example.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    style={styles.input}
                  />
                </View>

                {/* Password Field */}
                <Text style={styles.inputLabel}>Password</Text>
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
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    style={styles.input}
                  />
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
                </View>

                {/* Confirm Password Field */}
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isConfirmPasswordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isConfirmPasswordFocused ? colors.primary : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    style={styles.input}
                  />
                </View>

                {/* Action Button */}
                <AnimatedButton
                  variant="primary"
                  onPress={onSignUpPress}
                  loading={isLoading}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Sign Up</Text>
                </AnimatedButton>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Sign Up */}
                <AnimatedButton
                  variant="outline"
                  onPress={onGoogleSignUpPress}
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
                    <Text style={styles.googleButtonText}>Sign Up with Google</Text>
                  </View>
                </AnimatedButton>
              </View>
            ) : (
              // Verification Code Input Area
              <View>
                <Text style={styles.cardTitle}>Verify Email</Text>
                <Text style={styles.verifyDescription}>
                  We sent a 6-digit verification code to{" "}
                  <Text style={styles.verifyEmailHighlight}>{email}</Text>. Please enter it below.
                </Text>

                <Text style={styles.inputLabel}>Verification Code</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isCodeFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={isCodeFocused ? colors.primary : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setIsCodeFocused(true)}
                    onBlur={() => setIsCodeFocused(false)}
                    style={styles.input}
                  />
                </View>

                {/* Verification Action Buttons */}
                <AnimatedButton
                  variant="primary"
                  onPress={onVerifyPress}
                  loading={isLoading}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Verify & Register</Text>
                </AnimatedButton>

                <AnimatedButton
                  variant="text"
                  onPress={() => setPendingVerification(false)}
                  disabled={isLoading}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Back to Sign Up</Text>
                </AnimatedButton>
              </View>
            )}
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Text style={styles.footerLink}>Sign In</Text>
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
    marginBottom: spacing.md,
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
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
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
    marginBottom: 4,
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
    marginTop: spacing.xl,
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
  verifyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  verifyEmailHighlight: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: spacing.md,
    height: 52,
  },
  backButtonText: {
    color: colors.textSecondary,
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

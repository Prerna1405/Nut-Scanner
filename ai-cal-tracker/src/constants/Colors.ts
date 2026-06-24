// src/constants/Colors.ts

export const lightColors = {
  // Brand Colors
  primary: "#298F50",
  primaryLight: "#4CAF72",
  primaryDark: "#1F6E3D",
  secondaryAccent: "#34D399",

  // Background & Surface
  background: "#F8FFFA",
  surface: "#FFFFFF",
  surfaceHover: "#F3F4F6",
  inputBg: "#F9FAFB",

  // Neutral Colors
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  borderFocused: "#298F50",
  white: "#FFFFFF",
  black: "#000000",

  // Status Colors
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",

  // Shadow Colors
  shadowLight: "rgba(41, 143, 80, 0.05)",
  shadowMedium: "rgba(41, 143, 80, 0.12)",
  shadowHeavy: "rgba(0, 0, 0, 0.08)",
  shadowSolid: "#1F6E3D",
};

export const darkColors = {
  // Brand Colors
  primary: "#298F50",
  primaryLight: "#4CAF72",
  primaryDark: "#1F6E3D",
  secondaryAccent: "#34D399",

  // Background & Surface
  background: "#0D1411",
  surface: "#141D18",
  surfaceHover: "#1E2B24",
  inputBg: "#0A0F0D",

  // Neutral Colors
  textPrimary: "#F3F4F6",
  textSecondary: "#9CA3AF",
  border: "#202E27",
  borderFocused: "#298F50",
  white: "#FFFFFF",
  black: "#000000",

  // Status Colors
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",

  // Shadow Colors
  shadowLight: "rgba(0, 0, 0, 0.2)",
  shadowMedium: "rgba(0, 0, 0, 0.4)",
  shadowHeavy: "rgba(0, 0, 0, 0.6)",
  shadowSolid: "#1F6E3D",
};

export const colors = lightColors;

export const gradients = {
  primary: ["#298F50", "#4CAF72"] as const,
  secondary: ["#34D399", "#298F50"] as const,
  background: ["#F8FFFA", "#EBF7F0"] as const,
  accent: ["#4CAF72", "#34D399"] as const,
  danger: ["#EF4444", "#F87171"] as const,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },

  md: {
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 5,
  },

  lg: {
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },

  button3d: {
    shadowColor: colors.shadowSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 3,
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
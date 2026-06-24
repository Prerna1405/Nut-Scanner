import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";
import { colors, shadows, borderRadius } from "../constants/Colors";

interface AnimatedButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "text";
}

export function AnimatedButton({
  onPress,
  children,
  style,
  disabled = false,
  loading = false,
  variant = "primary",
}: AnimatedButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.96,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      case "text":
        return styles.text;
      default:
        return styles.primary;
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.button,
          getButtonStyle(),
          style,
          { transform: [{ scale: scaleValue }] },
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === "outline" || variant === "text"
                ? colors.primary
                : colors.white
            }
          />
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      },
    }),
  },
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    ...shadows.button3d,
  },
  secondary: {
    backgroundColor: "rgba(41, 143, 80, 0.08)",
    borderWidth: 0,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  text: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});

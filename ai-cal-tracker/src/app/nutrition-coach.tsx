import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "@clerk/clerk-expo";
import { getUserProfileData } from "../services/userService";
import { sendNutritionQuery } from "../services/nutritionCoachService";
import { AnimatedButton } from "../components/AnimatedButton";

interface NutritionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function NutritionCoachScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [messages, setMessages] = useState<NutritionMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfileData(user.id);
          setUserProfile(profile);
        } catch (e) {
          console.error("Failed to load profile:", e);
        }
      }
    };
    loadProfile();

    // Welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hi there! I'm your AI Nutrition Coach. Ask me anything about nutrition, healthy eating, meal planning, or fitness tips. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: NutritionMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    try {
      const aiResponse = await sendNutritionQuery(messages, userMsg.content, userProfile);
      setMessages(prev => [...prev, aiResponse]);
    } catch (e) {
      console.error(e);
      const errorMsg: NutritionMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      textAlign: "center",
      marginRight: 40,
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    },
    messagesContainer: {
      flex: 1,
      padding: 16,
    },
    messageBubble: {
      maxWidth: "80%",
      padding: 14,
      borderRadius: 20,
      marginBottom: 10,
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    userText: {
      color: "#fff",
      fontSize: 16,
    },
    assistantText: {
      color: colors.textPrimary,
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: "row",
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      gap: 10,
      alignItems: "center",
    },
    textInput: {
      flex: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    typingIndicator: {
      alignSelf: "flex-start",
      padding: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Nutrition Coach</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={
                  msg.role === "user" ? styles.userText : styles.assistantText
                }
              >
                {msg.content}
              </Text>
            </View>
          ))}
          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.assistantText}>...</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about nutrition, meals, or fitness..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={isTyping || !input.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

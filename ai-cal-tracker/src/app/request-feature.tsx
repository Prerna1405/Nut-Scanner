import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  LayoutAnimation,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { createFeatureRequest, getFeatureRequests, toggleUpvoteFeatureRequest, FeatureRequest } from "../services/featureService";
import { AnimatedButton } from "../components/AnimatedButton";
import { borderRadius, spacing, shadows } from "../constants/Colors";

export default function RequestFeatureScreen() {
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Requests Data States
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingMap, setVotingMap] = useState<Record<string, boolean>>({});

  // Form States
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadRequests = async (showSilently = false) => {
    if (!showSilently) setLoading(true);
    setError("");
    try {
      const data = await getFeatureRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests:", err);
      setError("Failed to retrieve feature requests. Please try again.");
    } finally {
      if (!showSilently) setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !user) return;
    setFormError("");

    if (!title.trim() || !description.trim()) {
      setFormError("Please enter both a title and description.");
      return;
    }

    setSubmitting(true);
    try {
      const creatorName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "App User";
      await createFeatureRequest(userId, creatorName, title.trim(), description.trim());
      
      // Reset form
      setTitle("");
      setDescription("");
      setIsFormExpanded(false);
      
      // Reload requests
      await loadRequests(true);
    } catch (err) {
      console.error("Failed to submit feature request:", err);
      setFormError("Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (requestId: string) => {
    if (!userId) return;
    
    // Prevent double taps while Firestore updates
    if (votingMap[requestId]) return;
    setVotingMap(prev => ({ ...prev, [requestId]: true }));

    // Optimistic Update
    setRequests(prevList => {
      return prevList.map(req => {
        if (req.id === requestId) {
          const alreadyUpvoted = req.upvotes.includes(userId);
          const newUpvotes = alreadyUpvoted
            ? req.upvotes.filter(id => id !== userId)
            : [...req.upvotes, userId];
          return {
            ...req,
            upvotes: newUpvotes,
            upvoteCount: newUpvotes.length,
          };
        }
        return req;
      }).sort((a, b) => b.upvoteCount - a.upvoteCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    try {
      await toggleUpvoteFeatureRequest(requestId, userId);
      // Silent sync to ensure database match
      const data = await getFeatureRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to vote:", err);
      // Revert if error
      await loadRequests(true);
    } finally {
      setVotingMap(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormExpanded(!isFormExpanded);
    setFormError("");
  };

  const renderRequestItem = ({ item }: { item: FeatureRequest }) => {
    const isUpvoted = userId ? item.upvotes.includes(userId) : false;
    const isOwnRequest = userId ? item.creatorId === userId : false;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Upvote Button Panel */}
        <TouchableOpacity
          style={[
            styles.votePanel,
            {
              backgroundColor: isUpvoted
                ? "rgba(41, 143, 80, 0.08)"
                : isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
              borderColor: isUpvoted ? colors.primary : colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => handleUpvote(item.id)}
        >
          <Ionicons
            name={isUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
            size={24}
            color={isUpvoted ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.voteCount, { color: isUpvoted ? colors.primary : colors.textPrimary }]}>
            {item.upvoteCount}
          </Text>
        </TouchableOpacity>

        {/* Feature Request Text Info */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            {isOwnRequest && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>You</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{item.description}</Text>
          <Text style={[styles.cardFooterText, { color: colors.textSecondary }]}>
            Suggested by <Text style={{ fontWeight: "700" }}>{item.creatorName}</Text> •{" "}
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Feature Request Board</Text>
        <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
          Upvote ideas suggested by other users or suggest your own feature. We implement the highest-rated suggestions!
        </Text>
      </View>

      {/* Suggest a Feature Accordion */}
      <View style={[styles.accordionContainer, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.accordionHeader, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
          onPress={toggleForm}
        >
          <View style={styles.accordionHeaderLeft}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>Suggest a New Feature</Text>
          </View>
          <Ionicons
            name={isFormExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isFormExpanded && (
          <View style={[styles.formBody, { backgroundColor: colors.surface }]}>
            {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Feature Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What feature would you like to see?"
                placeholderTextColor={colors.textSecondary}
                maxLength={80}
                style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description & details</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe how it works and why you want it..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={400}
                style={[
                  styles.textInput,
                  styles.textArea,
                  { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              />
            </View>

            <AnimatedButton
              variant="primary"
              onPress={handleSubmit}
              loading={submitting}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>Submit Suggestion</Text>
            </AnimatedButton>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Main Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Feature Requests</Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
          onPress={() => loadRequests()}
          disabled={loading}
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Screen Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading board...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} style={{ marginBottom: spacing.md }} />
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => loadRequests()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bulb-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: spacing.md }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No suggestions yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  Be the first to request a new feature! Tap "Suggest a New Feature" above to post your idea.
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.md,
    fontWeight: "600",
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  infoContainer: {
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  accordionContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.sm,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  formBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
  },
  formErrorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  inputContainer: {
    marginTop: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: spacing.lg,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    flexDirection: "row",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  votePanel: {
    width: 60,
    height: 68,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(41, 143, 80, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(41, 143, 80, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#298F50",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardFooterText: {
    fontSize: 11,
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});

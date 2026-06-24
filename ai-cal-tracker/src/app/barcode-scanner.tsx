import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "@clerk/clerk-expo";
import { searchByBarcode, Product } from "../services/openFoodFactsService";
import { AnimatedButton } from "../components/AnimatedButton";
import { addMealLog } from "../services/userService";

export default function BarcodeScannerScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [servingSize, setServingSize] = useState("1");

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    setProduct(null);
    try {
      const result = await searchByBarcode(barcode.trim());
      if (result) {
        setProduct(result);
      } else {
        setError("No product found for this barcode");
      }
    } catch (e) {
      console.error("Search error:", e);
      setError("Failed to search for product");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!user?.id || !product) return;
    const multiplier = parseFloat(servingSize) || 1;
    setSaving(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      
      await addMealLog(user.id, dateString, {
        name: product.name,
        calories: product.calories * multiplier,
        protein: product.protein * multiplier,
        carbs: product.carbs * multiplier,
        fats: product.fats * multiplier,
        time: new Date().toLocaleTimeString(),
      });
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
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
    content: {
      padding: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },
    productContainer: {
      marginTop: 20,
    },
    productCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
    },
    productImage: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: colors.border,
    },
    productName: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    productBrand: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    nutritionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    nutritionLabel: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    nutritionValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    servingInput: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 15,
      marginBottom: 15,
    },
    servingText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    smallInput: {
      width: 80,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.textPrimary,
    },
    errorText: {
      color: colors.error,
      marginTop: 10,
      textAlign: "center",
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
        <Text style={styles.headerTitle}>Barcode Scanner</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter Barcode</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type barcode number"
            placeholderTextColor={colors.textSecondary}
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
          />
          <View style={{ marginTop: 15 }}>
            <AnimatedButton
              onPress={handleSearch}
              disabled={loading || !barcode.trim()}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {loading ? "Searching..." : "Search Product"}
              </Text>
            </AnimatedButton>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {product && (
          <View style={styles.productContainer}>
            <View style={styles.productCard}>
              {product.imageUrl && (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.productName}>{product.name}</Text>
              {product.brand && (
                <Text style={styles.productBrand}>{product.brand}</Text>
              )}
              <View style={styles.servingInput}>
                <Text style={styles.servingText}>Servings:</Text>
                <TextInput
                  style={styles.smallInput}
                  value={servingSize}
                  onChangeText={setServingSize}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Calories</Text>
                <Text style={styles.nutritionValue}>
                  {Math.round(product.calories * (parseFloat(servingSize) || 1))}{" "}
                  kcal
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>
                  {Math.round(product.protein * (parseFloat(servingSize) || 1))}{" "}
                  g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Carbohydrates</Text>
                <Text style={styles.nutritionValue}>
                  {Math.round(product.carbs * (parseFloat(servingSize) || 1))} g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fats</Text>
                <Text style={styles.nutritionValue}>
                  {Math.round(product.fats * (parseFloat(servingSize) || 1))} g
                </Text>
              </View>
              <View style={[styles.nutritionRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.nutritionLabel}>Fiber</Text>
                <Text style={styles.nutritionValue}>
                  {Math.round(product.fiber * (parseFloat(servingSize) || 1))} g
                </Text>
              </View>
              <View style={{ marginTop: 20 }}>
                <AnimatedButton
                  onPress={handleSaveProduct}
                  disabled={saving}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {saving ? "Saving..." : "Add to Diary"}
                  </Text>
                </AnimatedButton>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

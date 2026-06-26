import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, useWindowDimensions, Alert, NativeModules } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { addMealLog } from '../services/userService';
import { analyzeFoodImage } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

// Emerald Theme Colors
const COLORS = {
  background: '#f8fafc',
  surface: '#ffffff',
  primary: '#10b981', // emerald-500
  primaryDark: '#059669', // emerald-600
  primaryLight: '#d1fae5', // emerald-100
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
};

interface ScanResult {
  foodName: string;
  confidence: number;
  portionSize: {
    estimatedDimensions: string;
    estimatedVolumeOrWeight: string;
    visualReferenceCues: string;
  };
  servingSize: {
    label: string;
    numberOfServingsInImage: number;
  };
  nutritionFacts: {
    calories: number;
    carbs: number;
    fats: number;
    protein: number;
    saturatedFat: number;
    fiber: number;
    sodium: number;
    sugar: number;
  };
  ingredientsList: string[];
  dietaryLabels: string[];
  healthAssessment: string;
}

interface HistoryItem {
  id: string;
  date: string;
  image: string;
  result: ScanResult;
}

const PRESETS = [
  { id: '1', name: 'Avocado Toast', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=500&q=80' },
  { id: '2', name: 'Grilled Chicken Salad', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' },
  { id: '3', name: 'Pancakes', image: 'https://images.unsplash.com/photo-1528207776546-384cb1119b27?w=500&q=80' },
];

export default function FoodScannerScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const router = useRouter();
  const { userId } = useAuth();
  
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [useCamera, setUseCamera] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
    return () => {
      stopCamera();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('@scan_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to load history", err);
    }
  };

  const saveToHistory = async (image: string, result: ScanResult) => {
    try {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image,
        result
      };
      const updated = [newItem, ...history].slice(0, 10); // Keep last 10
      setHistory(updated);
      await AsyncStorage.setItem('@scan_history', JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save history", err);
    }
  };

  const startCamera = async () => {
    if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setUseCamera(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        setError('Camera access denied or unavailable.');
        setUseCamera(false);
      }
    } else {
      // Mobile fallback using ImagePicker
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        base64: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleImageSelection(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        handleImageSelection(dataUrl);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      base64: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      handleImageSelection(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handleImageSelection = async (uri: string) => {
    setActiveImage(uri);
    setScanResult(null);
    setError(null);
    analyzeImage(uri);
  };

  const handleLogMeal = async () => {
    if (!userId) {
      Alert.alert("Authentication Error", "You must be signed in to log food.");
      return;
    }
    if (!scanResult) return;

    setIsLogging(true);
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];
      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await addMealLog(userId, dateString, {
        name: scanResult.foodName,
        calories: scanResult.nutritionFacts.calories,
        protein: scanResult.nutritionFacts.protein,
        carbs: scanResult.nutritionFacts.carbs,
        fats: scanResult.nutritionFacts.fats,
        time: timeString,
      });

      Alert.alert(
        "Logged Successfully",
        `Added "${scanResult.foodName}" to your daily log!`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)" as any) }]
      );
    } catch (error) {
      Alert.alert("Logging Failed", "Could not save your meal.");
    } finally {
      setIsLogging(false);
    }
  };

  const handleDragOver = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
    }
  };

  const handleDrop = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            handleImageSelection(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getBaseUrl = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        return window.location.origin;
      }
    }
    
    // For mobile development (Expo Go or custom dev client)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return `http://${hostUri}`;
    }
    
    // Fallback for production APK (user should set this in env later)
    return process.env.EXPO_PUBLIC_API_URL || '';
  };

  const analyzeImage = async (imageUri: string) => {
    setIsScanning(true);
    try {
      // Direct call to Gemini from the client side using aiService
      const aiResult = await analyzeFoodImage(imageUri);
      
      // Since aiService now directly returns the ScanResult schema, we can just use it
      setScanResult(aiResult as any);
      saveToHistory(imageUri, aiResult as any);
    } catch (err: any) {
      console.error("Scanning failed", err);
      setError(err.message || 'An unexpected error occurred during scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const renderMacroBar = (value: number, total: number, color: string, label: string) => {
    const percentage = Math.min(100, Math.max(0, (value / (total || 1)) * 100));
    return (
      <View style={styles.macroRow}>
        <Text style={styles.macroLabel}>{label} ({value}g)</Text>
        <View style={styles.macroBarContainer}>
          <View style={[styles.macroBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'Nutrition Scanner', headerStyle: { backgroundColor: COLORS.surface } }} />
      
      <View style={[styles.layout, isLargeScreen && styles.layoutLarge]}>
        
        {/* LEFT COLUMN - CONTROLS */}
        <View style={[styles.column, styles.leftColumn]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Image Source</Text>
            
            {!useCamera ? (
              <View 
                style={styles.uploadZone}
                // @ts-ignore
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Text style={styles.uploadText}>
                  {Platform.OS === 'web' ? 'Drag & Drop image here, or' : 'Select an image'}
                </Text>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
                    <Text style={styles.primaryButtonText}>Upload Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={startCamera}>
                    <Text style={styles.secondaryButtonText}>Open Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.cameraContainer}>
                {Platform.OS === 'web' && (
                  // @ts-ignore
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8 }}
                    autoPlay
                    playsInline
                  />
                )}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={capturePhoto}>
                    <Text style={styles.primaryButtonText}>Capture</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={stopCamera}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Try a Preset</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {PRESETS.map(preset => (
                <TouchableOpacity 
                  key={preset.id} 
                  style={styles.presetCard}
                  onPress={() => handleImageSelection(preset.image)}
                >
                  <Image source={{ uri: preset.image }} style={styles.presetImage} />
                  <Text style={styles.presetText} numberOfLines={1}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {history.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Scans</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {history.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.presetCard}
                    onPress={() => {
                      setActiveImage(item.image);
                      setScanResult(item.result);
                    }}
                  >
                    <Image source={{ uri: item.image }} style={styles.presetImage} />
                    <Text style={styles.presetText} numberOfLines={1}>{item.result.foodName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* RIGHT COLUMN - ANALYTICS */}
        <View style={[styles.column, styles.rightColumn]}>
          <View style={[styles.card, styles.analyticsCard]}>
            {activeImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: activeImage }} style={styles.previewImage} />
                {isScanning && (
                  <View style={styles.scannerOverlay}>
                    <View style={styles.scannerLine} />
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.scanningText}>Analyzing Nutrition & Portions...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Upload or capture an image to see analysis.</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {scanResult && !isScanning && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Text style={styles.foodName}>{scanResult.foodName}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{Math.round(scanResult.confidence * 100)}% Match</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{scanResult.nutritionFacts.calories}</Text>
                    <Text style={styles.statLabel}>Calories</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{scanResult.servingSize.numberOfServingsInImage}x</Text>
                    <Text style={styles.statLabel}>Serving: {scanResult.servingSize.label}</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Macros Breakdown</Text>
                <View style={styles.macrosContainer}>
                  {renderMacroBar(scanResult.nutritionFacts.carbs, 100, '#3b82f6', 'Carbs')}
                  {renderMacroBar(scanResult.nutritionFacts.protein, 100, '#10b981', 'Protein')}
                  {renderMacroBar(scanResult.nutritionFacts.fats, 100, '#f59e0b', 'Fats')}
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Portion Analysis</Text>
                    <Text style={styles.detailText}>• <Text style={styles.boldText}>Size:</Text> {scanResult.portionSize.estimatedDimensions}</Text>
                    <Text style={styles.detailText}>• <Text style={styles.boldText}>Est. Weight:</Text> {scanResult.portionSize.estimatedVolumeOrWeight}</Text>
                    <Text style={styles.detailText}>• <Text style={styles.boldText}>Visual Cues:</Text> {scanResult.portionSize.visualReferenceCues}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Dietary Info</Text>
                    <View style={styles.chipContainer}>
                      {scanResult.dietaryLabels.map((label, idx) => (
                        <View key={idx} style={styles.chip}>
                          <Text style={styles.chipText}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.detailText}>{scanResult.ingredientsList.join(', ')}</Text>

                <View style={styles.healthBox}>
                  <Text style={styles.healthBoxTitle}>Health Assessment</Text>
                  <Text style={styles.healthBoxText}>{scanResult.healthAssessment}</Text>
                </View>

                {/* Log to Dashboard Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, { marginTop: 16, paddingVertical: 14 }]} 
                  onPress={handleLogMeal}
                  disabled={isLogging}
                >
                  {isLogging ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.primaryButtonText, { textAlign: 'center', fontSize: 16 }]}>Log to Dashboard</Text>
                  )}
                </TouchableOpacity>

              </View>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  layout: {
    flexDirection: 'column',
    gap: 16,
  },
  layoutLarge: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    gap: 16,
  },
  leftColumn: {
    flex: 4, // 40% width on large screens
  },
  rightColumn: {
    flex: 6, // 60% width on large screens
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsCard: {
    minHeight: 500,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  uploadText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraContainer: {
    alignItems: 'center',
    width: '100%',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    fontSize: 14,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetCard: {
    marginRight: 12,
    width: 100,
  },
  presetImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  presetText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyStateText: {
    color: COLORS.textLight,
    fontSize: 16,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // Emerald tint
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  scannerLine: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  scanningText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 12,
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  resultContainer: {
    gap: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  macrosContainer: {
    gap: 8,
  },
  macroRow: {
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  macroBarContainer: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailSection: {
    flex: 1,
    minWidth: 200,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '600',
  },
  healthBox: {
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  healthBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  healthBoxText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
});

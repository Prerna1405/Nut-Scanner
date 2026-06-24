import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../config/firebase";

// Predefined list of admin emails for quick admin access
const ADMIN_EMAILS = [
  "ahireprerna05@gmail.com", // Add your admin emails here
];

interface UserProfile {
  id: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

/**
 * Checks if a user is an admin based on either:
 * 1. Their email being in the predefined ADMIN_EMAILS list
 * 2. An isAdmin field in their Firestore profile
 */
export async function checkIsAdmin(userId: string, email?: string): Promise<boolean> {
  // First check if email is in predefined admin list
  if (email && ADMIN_EMAILS.includes(email)) {
    return true;
  }

  // Then check Firestore for isAdmin field
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return !!data.isAdmin;
    }
    return false;
  } catch (error) {
    console.error("[Firebase Sync] Error checking admin status:", error);
    return false;
  }
}

export interface OnboardingData {
  gender: string;
  goal: string;
  workoutFrequency: string;
  birthdate: string;
  height: string;
  weight: number;
}

export interface MealLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  time: string;
}

export interface WorkoutLog {
  id: string;
  name: string;
  duration: number; // minutes
  caloriesBurned: number;
  time: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  consumedCalories: number;
  consumedProtein: number;
  consumedFats: number;
  consumedCarbs: number;
  consumedWater?: number;
  burnedCalories?: number;
  meals: MealLog[];
  workouts?: WorkoutLog[];
}

/**
 * Checks if the user exists in Firebase Firestore, and if not, saves their basic profile information.
 */
export async function saveUserToFirebase(user: UserProfile) {
  if (!user.id) {
    console.warn("Cannot save user to Firebase: missing user ID.");
    return;
  }

  try {
    const userRef = doc(db, "users", user.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const email = user.emailAddress || "";
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || "User";
      const imageUrl = user.imageUrl || "";

      await setDoc(userRef, {
        clerkId: user.id,
        email,
        firstName,
        lastName,
        fullName,
        imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Firebase Sync] Successfully saved profile for user ${user.id} to Firestore.`);
    } else {
      console.log(`[Firebase Sync] User profile for ${user.id} already exists in Firestore. Skipping save.`);
    }
  } catch (error) {
    console.error("[Firebase Sync] Error checking or saving user to Firestore:", error);
    throw error;
  }
}

/**
 * Updates the user profile in Firestore with onboarding answers.
 */
export async function updateUserProfile(userId: string, data: OnboardingData) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firebase Sync] Successfully updated onboarding profile for user ${userId} in Firestore.`);
  } catch (error) {
    console.error("[Firebase Sync] Error updating user profile in Firestore:", error);
    throw error;
  }
}

/**
 * Saves the AI generated fitness plan to the user profile in Firestore.
 */
export async function saveFitnessPlan(userId: string, plan: any) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      fitnessPlan: plan,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firebase Sync] Successfully saved fitness plan for user ${userId} in Firestore.`);
  } catch (error) {
    console.error("[Firebase Sync] Error saving fitness plan to Firestore:", error);
    throw error;
  }
}

/**
 * Checks if the user has completed onboarding in Firestore.
 */
export async function checkOnboardingCompleted(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return !!data.onboardingCompleted;
    }
    return false;
  } catch (error) {
    console.error("[Firebase Sync] Error checking onboarding completed status:", error);
    return false;
  }
}

/**
 * Fetches the user profile onboarding data from Firestore.
 */
export async function getUserProfileData(userId: string): Promise<OnboardingData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        gender: data.gender || "",
        goal: data.goal || "",
        workoutFrequency: data.workoutFrequency || "",
        birthdate: data.birthdate || "",
        height: data.height || "",
        weight: typeof data.weight === "number" ? data.weight : parseFloat(data.weight) || 70,
      };
    }
    return null;
  } catch (error) {
    console.error("[Firebase Sync] Error fetching user profile data:", error);
    return null;
  }
}

/**
 * Fetches the AI generated fitness plan for the user from Firestore.
 */
export async function getUserFitnessPlan(userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.fitnessPlan || null;
    }
    return null;
  } catch (error) {
    console.error("[Firebase Sync] Error fetching user fitness plan:", error);
    return null;
  }
}

/**
 * Updates the user's fitness plan targets manually.
 */
export async function updateFitnessPlanTargets(userId: string, targets: { calories: number; protein: number; fats: number; carbs: number }) {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    const existingPlan = data.fitnessPlan || {};
    
    await updateDoc(userRef, {
      fitnessPlan: {
        ...existingPlan,
        dailyCalories: targets.calories,
        macros: {
          ...(existingPlan.macros || {}),
          protein: targets.protein,
          fats: targets.fats,
          carbs: targets.carbs,
        }
      },
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firebase Sync] Successfully updated fitness plan targets for user ${userId}.`);
  } catch (error) {
    console.error("[Firebase Sync] Error updating fitness plan targets:", error);
    throw error;
  }
}

/**
 * Fetches the daily log for a specific date from Firestore.
 */
export async function getDailyLog(userId: string, dateString: string): Promise<DailyLog | null> {
  try {
    const logRef = doc(db, "users", userId, "dailyLogs", dateString);
    const snap = await getDoc(logRef);
    if (snap.exists()) {
      return snap.data() as DailyLog;
    }
    return null;
  } catch (error) {
    console.error("[Firebase Sync] Error fetching daily log:", error);
    return null;
  }
}

/**
 * Adds a new meal log to a specific date in Firestore and updates the daily totals.
 */
export async function addMealLog(userId: string, dateString: string, meal: Omit<MealLog, 'id'>) {
  try {
    const logRef = doc(db, "users", userId, "dailyLogs", dateString);
    const mealWithId = { ...meal, id: new Date().getTime().toString() };
    
    const snap = await getDoc(logRef);
    if (!snap.exists()) {
      // Create new doc for this day
      await setDoc(logRef, {
        date: dateString,
        consumedCalories: meal.calories,
        consumedProtein: meal.protein,
        consumedFats: meal.fats,
        consumedCarbs: meal.carbs,
        meals: [mealWithId],
      });
    } else {
      // Update existing doc
      await updateDoc(logRef, {
        consumedCalories: increment(meal.calories),
        consumedProtein: increment(meal.protein),
        consumedFats: increment(meal.fats),
        consumedCarbs: increment(meal.carbs),
        meals: arrayUnion(mealWithId)
      });
    }
  } catch (error) {
    console.error("[Firebase Sync] Error adding meal log:", error);
    throw error;
  }
}

/**
 * Adds water to the daily log (in ml)
 */
export async function logWater(userId: string, dateString: string, amountInMl: number) {
  try {
    const logRef = doc(db, "users", userId, "dailyLogs", dateString);
    const snap = await getDoc(logRef);
    if (!snap.exists()) {
      await setDoc(logRef, {
        date: dateString,
        consumedCalories: 0,
        consumedProtein: 0,
        consumedFats: 0,
        consumedCarbs: 0,
        consumedWater: amountInMl,
        meals: [],
      });
    } else {
      await updateDoc(logRef, {
        consumedWater: increment(amountInMl),
      });
    }
  } catch (error) {
    console.error("[Firebase Sync] Error logging water:", error);
    throw error;
  }
}

/**
 * Adds a workout to the daily log and increments burned calories.
 */
export async function logWorkout(userId: string, dateString: string, workout: Omit<WorkoutLog, "id">) {
  try {
    const logRef = doc(db, "users", userId, "dailyLogs", dateString);
    const snap = await getDoc(logRef);
    
    const newWorkout = { ...workout, id: Date.now().toString() };
    
    if (!snap.exists()) {
      await setDoc(logRef, {
        date: dateString,
        consumedCalories: 0,
        consumedProtein: 0,
        consumedFats: 0,
        consumedCarbs: 0,
        consumedWater: 0,
        burnedCalories: workout.caloriesBurned,
        meals: [],
        workouts: [newWorkout],
      });
    } else {
      await updateDoc(logRef, {
        burnedCalories: increment(workout.caloriesBurned),
        workouts: arrayUnion(newWorkout),
      });
    }
    console.log(`[Firebase Sync] Workout added to log for ${dateString}`);
  } catch (error) {
    console.error("[Firebase Sync] Error logging workout:", error);
    throw error;
  }
}

/**
 * Updates the user's weight in their profile and logs it in the historical weightLogs subcollection.
 */
export async function logWeight(userId: string, weightVal: number, dateString: string) {
  try {
    // 1. Update the user profile's current weight
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      weight: weightVal,
      updatedAt: new Date().toISOString(),
    });

    // 2. Add or update the weight log entry for the specified date
    const weightLogRef = doc(db, "users", userId, "weightLogs", dateString);
    await setDoc(weightLogRef, {
      date: dateString,
      weight: weightVal,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[Firebase Sync] Successfully logged weight ${weightVal} kg on ${dateString} for user ${userId}`);
  } catch (error) {
    console.error("[Firebase Sync] Error logging weight:", error);
    throw error;
  }
}

export interface WeeklyAiInsights {
  calorieInsight: string;
  hydrationInsight: string;
  workoutInsight: string;
  healthScore: number;
  motivation: string;
  generatedAt: string;
}

export async function getWeeklyAiInsights(userId: string): Promise<WeeklyAiInsights | null> {
  try {
    const insightsRef = doc(db, "users", userId, "aiInsights", "weekly");
    const snap = await getDoc(insightsRef);
    if (snap.exists()) {
      return snap.data() as WeeklyAiInsights;
    }
    return null;
  } catch (error) {
    console.error("[Firebase Sync] Error fetching weekly AI insights:", error);
    return null;
  }
}

export async function saveWeeklyAiInsights(userId: string, insights: Omit<WeeklyAiInsights, 'generatedAt'>) {
  try {
    const insightsRef = doc(db, "users", userId, "aiInsights", "weekly");
    const dataWithTimestamp = {
      ...insights,
      generatedAt: new Date().toISOString(),
    };
    await setDoc(insightsRef, dataWithTimestamp);
    console.log(`[Firebase Sync] Saved weekly AI insights for user ${userId}.`);
  } catch (error) {
    console.error("[Firebase Sync] Error saving weekly AI insights:", error);
    throw error;
  }
}

export async function updateFullNutritionGoals(
  userId: string,
  goals: { calories: number; protein: number; fats: number; carbs: number; waterIntakeLiters: number }
) {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const existingPlan = data.fitnessPlan || {};

    await updateDoc(userRef, {
      fitnessPlan: {
        ...existingPlan,
        dailyCalories: goals.calories,
        waterIntakeLiters: goals.waterIntakeLiters,
        waterIntake: goals.waterIntakeLiters, // Support both naming variants used in index.tsx
        macros: {
          ...(existingPlan.macros || {}),
          protein: goals.protein,
          fats: goals.fats,
          carbs: goals.carbs,
        },
      },
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firebase Sync] Successfully updated full goals for user ${userId}.`);
  } catch (error) {
    console.error("[Firebase Sync] Error updating full goals:", error);
    throw error;
  }
}

export interface CalculatedNutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterIntakeLiters: number;
}

export function calculateNutritionGoals(onboardingData: OnboardingData): CalculatedNutritionGoals {
  // Calculate age from birthdate
  const birthDate = new Date(onboardingData.birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Parse height (feet/inches to cm)
  let heightCm: number;
  const heightMatch = onboardingData.height.match(/(\d+)'(\d+)"/);
  if (heightMatch) {
    const feet = parseInt(heightMatch[1]);
    const inches = parseInt(heightMatch[2]);
    heightCm = (feet * 30.48) + (inches * 2.54);
  } else {
    heightCm = 170; // default if parsing fails
  }

  const weightKg = onboardingData.weight;

  // Calculate BMR using Mifflin-St Jeor equation
  let bmr: number;
  if (onboardingData.gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // Calculate TDEE based on activity level
  let activityMultiplier: number;
  switch (onboardingData.workoutFrequency) {
    case "2-3-days":
      activityMultiplier = 1.375;
      break;
    case "3-4-days":
      activityMultiplier = 1.55;
      break;
    case "5-6-days":
      activityMultiplier = 1.725;
      break;
    default:
      activityMultiplier = 1.2; // sedentary
  }
  let tdee = bmr * activityMultiplier;

  // Adjust based on goal
  let calories: number;
  switch (onboardingData.goal) {
    case "lose-weight":
      calories = Math.round(tdee - 500);
      break;
    case "gain-weight":
      calories = Math.round(tdee + 500);
      break;
    case "maintain-weight":
    default:
      calories = Math.round(tdee);
      break;
  }

  // Ensure calories are within reasonable range
  calories = Math.max(1200, Math.min(4000, calories));

  // Calculate macros
  // Protein: 1.6-2.2g per kg of body weight
  const protein = Math.round(weightKg * 2);
  // Fats: 25% of total calories
  const fats = Math.round((calories * 0.25) / 9);
  // Carbs: remaining calories
  const carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);

  // Water intake: 35ml per kg of body weight
  const waterIntakeLiters = Math.round((weightKg * 35) / 100) / 10;

  return {
    calories,
    protein,
    carbs,
    fats,
    waterIntakeLiters,
  };
}

export interface UserPreferences {
  theme: "system" | "light" | "dark";
  notificationsEnabled: boolean;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.preferences || null;
    }
    return null;
  } catch (error) {
    console.error("[Firebase Sync] Error fetching user preferences:", error);
    return null;
  }
}

export async function saveUserPreferences(userId: string, preferences: UserPreferences) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      preferences,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firebase Sync] Saved user preferences for user ${userId}.`);
  } catch (error) {
    console.error("[Firebase Sync] Error saving user preferences:", error);
    throw error;
  }
}

export async function getWeightHistory(userId: string) {
  try {
    const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
    const weightLogsRef = collection(db, "users", userId, "weightLogs");
    const q = query(weightLogsRef, orderBy("date", "desc"));
    const snap = await getDocs(q);
    const history: { date: string; weight: number }[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      history.push({
        date: data.date,
        weight: data.weight,
      });
    });
    return history;
  } catch (error) {
    console.error("[Firebase Sync] Error fetching weight history:", error);
    return [];
  }
}


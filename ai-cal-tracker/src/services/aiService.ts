import { GoogleGenerativeAI } from "@google/generative-ai";

export interface OnboardingData {
  gender: string;
  goal: string;
  workoutFrequency: string;
  birthdate: string;
  height: string;
  weight: number;
}

export interface FitnessPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterIntakeLiters: number;
  fitnessAdvice: string[];
}

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
// Preferred Gemini models in order of priority
const PREFERRED_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3-flash-preview", "gemini-1.5-flash"];
let cachedModel: string | null = null;

/**
 * Resolve the best available Gemini model that supports generateContent.
 */
async function resolveModel(): Promise<string> {
  if (cachedModel) return cachedModel;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      console.error("[AI Service] Failed to fetch models:", response.status);
      throw new Error(`Model list request failed with status ${response.status}`);
    }
    const data = await response.json();
    const models: any[] = data.models || [];
    const available: string[] = models
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map(m => m.name);
    for (const pref of PREFERRED_MODELS) {
      if (available.includes(pref)) {
        cachedModel = pref;
        return pref;
      }
    }
  } catch (e) {
    console.error("[AI Service] Model resolution error:", e);
  }
  // Fallback to a default model
  cachedModel = "gemini-2.5-flash";
  return cachedModel;
}

/**
 * Parse and rethrow Gemini errors with clearer messages.
 */
function handleGeminiError(error: any): never {
  console.error("[AI Service] Gemini error:", error);
  const msg = (error?.message || "").toString().toLowerCase();
  if (msg.includes("not found")) {
    throw new Error("Selected Gemini model not found. Verify the model name.");
  }
  if (msg.includes("unsupported")) {
    throw new Error("The requested generation method is not supported by the selected Gemini model.");
  }
  if (msg.includes("api key")) {
    throw new Error("Gemini API key is invalid or missing.");
  }
  if (msg.includes("quota") || msg.includes("429") || msg.includes("503") || msg.includes("high demand")) {
    throw new Error("Gemini API unavailable. Using fallback data.");
  }
  throw error;
}

export async function generateFitnessPlan(data: OnboardingData): Promise<FitnessPlan> {
  // First try Gemini API
  if (apiKey) {
    try {
      const modelName = await resolveModel();
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
You are a professional fitness and nutrition coach. Based on the following user data, calculate their daily caloric needs, macronutrient split (protein, carbs, fats), daily water intake, and provide 3-5 short pieces of actionable fitness advice.

User Data:
- Gender: ${data.gender}
- Goal: ${data.goal} (e.g., lose weight, gain weight, maintain)
- Workout Frequency: ${data.workoutFrequency}
- Birthdate: ${data.birthdate} (use this to approximate age)
- Height: ${data.height}
- Weight: ${data.weight} kg

Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or extra text:
{
  "dailyCalories": 2000,
  "proteinGrams": 150,
  "carbsGrams": 200,
  "fatsGrams": 65,
  "waterIntakeLiters": 3.0,
  "fitnessAdvice": [
    "Drink a glass of water first thing in the morning.",
    "Prioritize protein in every meal to support muscle recovery."
  ]
}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Clean up potential markdown formatting if the model still returns it
      const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const plan: FitnessPlan = JSON.parse(jsonString);

      return plan;
    } catch (error) {
      console.warn("[AI Service] Gemini failed for fitness plan, using fallback", error);
    }
  }

  // Fallback: Calculate using Mifflin-St Jeor equation
  const birthDate = new Date(data.birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Parse height (assume format like "175 cm" or "175")
  const heightCm = parseInt(data.height.replace(/[^0-9]/g, "")) || 170;

  // Mifflin-St Jeor equation
  const isMale = data.gender.toLowerCase().includes("male");
  let bmr = isMale 
    ? 10 * data.weight + 6.25 * heightCm - 5 * age + 5
    : 10 * data.weight + 6.25 * heightCm - 5 * age - 161;

  // Activity factor based on workout frequency
  let activityFactor = 1.2; // Sedentary
  const workoutFreq = data.workoutFrequency.toLowerCase();
  if (workoutFreq.includes("daily") || workoutFreq.includes("7")) activityFactor = 1.725;
  else if (workoutFreq.includes("5") || workoutFreq.includes("6")) activityFactor = 1.55;
  else if (workoutFreq.includes("3") || workoutFreq.includes("4")) activityFactor = 1.375;
  else if (workoutFreq.includes("1") || workoutFreq.includes("2")) activityFactor = 1.2;

  let tdee = bmr * activityFactor;

  // Adjust for goal
  let dailyCalories = Math.round(tdee);
  if (data.goal.toLowerCase().includes("lose")) dailyCalories = Math.round(tdee * 0.8);
  else if (data.goal.toLowerCase().includes("gain")) dailyCalories = Math.round(tdee * 1.15);

  // Macro split
  const proteinGrams = Math.round(data.weight * 2); // 2g per kg
  const fatsGrams = Math.round((dailyCalories * 0.25) / 9);
  const carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4);
  const waterIntakeLiters = Math.max(2, Math.round(data.weight * 0.035 * 10) / 10);

  // Fitness advice
  const fitnessAdvice = [
    "Stay consistent with your meal times to regulate metabolism.",
    "Prioritize whole, unprocessed foods for better nutrient absorption.",
    "Get 7-9 hours of sleep nightly for optimal recovery.",
    "Track your progress weekly to stay motivated.",
    "Stay hydrated throughout the day."
  ];

  return {
    dailyCalories,
    proteinGrams,
    carbsGrams: Math.max(0, carbsGrams),
    fatsGrams,
    waterIntakeLiters,
    fitnessAdvice
  };
}

export interface FoodAnalysisResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// Common foods database for fallback
const commonFoods = [
  { foodName: "Poha", calories: 180, protein: 4, carbs: 35, fat: 3, servingSize: "1 plate (approx 150g)" },
  { foodName: "Biryani", calories: 450, protein: 20, carbs: 55, fat: 18, servingSize: "1 plate (approx 300g)" },
  { foodName: "Butter Chicken", calories: 400, protein: 25, carbs: 15, fat: 28, servingSize: "1 bowl (approx 200g)" },
  { foodName: "Dal Makhani", calories: 350, protein: 18, carbs: 25, fat: 22, servingSize: "1 bowl (approx 200g)" },
  { foodName: "Samosa", calories: 250, protein: 5, carbs: 30, fat: 13, servingSize: "1 piece (approx 80g)" },
  { foodName: "Pizza", calories: 285, protein: 12, carbs: 35, fat: 10, servingSize: "1 slice (approx 107g)" },
  { foodName: "Burger", calories: 450, protein: 22, carbs: 40, fat: 22, servingSize: "1 piece" },
  { foodName: "Pasta", calories: 220, protein: 8, carbs: 43, fat: 1.3, servingSize: "1 cup cooked" },
  { foodName: "Salad", calories: 150, protein: 5, carbs: 12, fat: 8, servingSize: "1 bowl" },
  { foodName: "Sandwich", calories: 300, protein: 15, carbs: 35, fat: 10, servingSize: "1 medium" },
  { foodName: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g" },
  { foodName: "Brown Rice", calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: "1 cup cooked" },
  { foodName: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: "1 medium" },
  { foodName: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: "1 medium (182g)" },
  { foodName: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: "1 cup" },
];

export async function analyzeFoodImage(imageUri: string): Promise<FoodAnalysisResult> {
  // First try Gemini API
  if (apiKey) {
    try {
      // 1. Fetch image and convert to Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // 2. Convert Blob to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const mimeType = blob.type || "image/jpeg";

      // Try multiple models for better reliability
      const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
      
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `
Analyze the food or dish visible in the provided image.
Estimate its nutritional content including total calories (kcal), protein (g), carbohydrates (g), and fat (g) for a typical serving.
Also provide the identified dish/food name and estimate the serving size.

Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting, no code block backticks (like \`\`\`json), and no extra text:
{
  "foodName": "Spaghetti Bolognese",
  "calories": 450,
  "protein": 20,
  "carbs": 60,
  "fat": 15,
  "servingSize": "1 plate (approx 350g)"
}
          `;

          const imagePart = {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          };

          const result = await model.generateContent([prompt, imagePart]);
          const text = result.response.text();

          // Clean up potential markdown formatting if the model still returns it
          const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const analysis: FoodAnalysisResult = JSON.parse(jsonString);

          // Validate properties and check types
          if (analysis.foodName && typeof analysis.calories === "number") {
            return {
              foodName: analysis.foodName,
              calories: Number(analysis.calories) || 0,
              protein: Number(analysis.protein) || 0,
              carbs: Number(analysis.carbs) || 0,
              fat: Number(analysis.fat) || 0,
              servingSize: analysis.servingSize || "1 serving",
            };
          }
        } catch (modelError) {
          console.warn(`[AI Service] Model ${modelName} failed, trying next one`, modelError);
          continue;
        }
      }
    } catch (error) {
      console.warn("[AI Service] All Gemini models failed for image analysis, using fallback", error);
    }
  }

  // Fallback: Return a common food (prioritizing poha for this user's case!)
  return commonFoods[0];
}

export interface WeeklyInsights {
  calorieInsight: string;
  hydrationInsight: string;
  workoutInsight: string;
  healthScore: number;
  motivation: string;
}

export async function generateWeeklyInsights(
  profile: OnboardingData,
  weeklySummary: {
    totalConsumed: number;
    totalBurned: number;
    totalWater: number;
    avgConsumed: number;
    avgBurned: number;
    avgWater: number;
    weight: number;
    streak: number;
  }
): Promise<WeeklyInsights> {
  // First try Gemini API
  if (apiKey) {
    try {
      const modelName = await resolveModel();
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
You are an expert fitness and nutrition coach. Based on the user's weekly metrics and profile, generate 4 wellness insights in a bento-grid layout:
1. Calorie Insight (analyze their weekly consumed vs burned calories relative to their onboarding weight management goal: "${profile.goal}")
2. Hydration Insight (analyze their water intake. Total consumed: ${weeklySummary.totalWater} ml, Avg: ${weeklySummary.avgWater} ml/day)
3. Workout Insight (suggest optimizations based on their onboarding workout frequency: "${profile.workoutFrequency}")
4. Health Score (an integer from 1 to 100 rating their weekly progress) and a short motivational quote.

User Profile:
- Goal: ${profile.goal}
- Height: ${profile.height}
- Weight: ${weeklySummary.weight} kg
- Target Activity Frequency: ${profile.workoutFrequency}

Weekly Summary Metrics:
- Total Calories Consumed: ${weeklySummary.totalConsumed} kcal (Avg: ${weeklySummary.avgConsumed} kcal/day)
- Total Calories Burned: ${weeklySummary.totalBurned} kcal (Avg: ${weeklySummary.avgBurned} kcal/day)
- Total Water Consumed: ${weeklySummary.totalWater} ml (Avg: ${weeklySummary.avgWater} ml/day)
- Active Streak: ${weeklySummary.streak} days

Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting, no code block backticks (like \`\`\`json), and no extra text:
{
  "calorieInsight": "You averaged 1,800 kcal, which is on track for weight loss. Keep balancing your workouts.",
  "hydrationInsight": "Excellent hydration! You hit an average of 2.2L daily, keeping your cellular metabolism high.",
  "workoutInsight": "With 3 sessions this week, focus on progressive overload on your compound lifts.",
  "healthScore": 85,
  "motivation": "Consistency is the key to unlocking your true potential. Keep showing up!"
}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const insights: WeeklyInsights = JSON.parse(jsonString);
      return insights;
    } catch (error) {
      console.warn("[AI Service] Gemini failed for weekly insights, using fallback", error);
    }
  }

  // Fallback: Generate insights based on rules
  let calorieInsight = "";
  const netCalories = weeklySummary.totalConsumed - weeklySummary.totalBurned;
  const isWeightLoss = profile.goal.toLowerCase().includes("lose");
  const isWeightGain = profile.goal.toLowerCase().includes("gain");

  if (isWeightLoss) {
    if (netCalories < -3500) {
      calorieInsight = `Great job! You're in a deficit of ~${Math.abs(Math.round(netCalories / 7))} kcal/day, on track for weight loss.`;
    } else if (netCalories < 0) {
      calorieInsight = `Good effort! You're in a slight deficit. Keep it up for steady progress.`;
    } else {
      calorieInsight = `You're in a slight surplus. Consider adjusting your intake or increasing activity.`;
    }
  } else if (isWeightGain) {
    if (netCalories > 3500) {
      calorieInsight = `Excellent! You're in a surplus of ~${Math.round(netCalories / 7)} kcal/day, perfect for muscle gain.`;
    } else if (netCalories > 0) {
      calorieInsight = `Good start! You're in a slight surplus. Consider increasing calories slightly for faster gains.`;
    } else {
      calorieInsight = `You're in a deficit. To gain weight, you'll need to increase your calorie intake.`;
    }
  } else {
    if (Math.abs(netCalories) < 3500) {
      calorieInsight = `Perfect! You're maintaining your weight well with balanced intake and activity.`;
    } else {
      calorieInsight = `You're trending away from maintenance. Consider adjusting your intake.`;
    }
  }

  // Hydration insight
  let hydrationInsight = "";
  const avgWaterLiters = weeklySummary.avgWater / 1000;
  if (avgWaterLiters >= 2.5) {
    hydrationInsight = `Outstanding hydration! You averaged ${avgWaterLiters.toFixed(1)}L daily - keep it up!`;
  } else if (avgWaterLiters >= 2) {
    hydrationInsight = `Good hydration! You hit an average of ${avgWaterLiters.toFixed(1)}L daily.`;
  } else if (avgWaterLiters >= 1.5) {
    hydrationInsight = `You're getting some water, but aim for at least 2L daily for optimal health.`;
  } else {
    hydrationInsight = `Let's work on hydration! Try to drink more water throughout the day.`;
  }

  // Workout insight
  let workoutInsight = "";
  const workoutFreq = profile.workoutFrequency.toLowerCase();
  if (workoutFreq.includes("daily") || workoutFreq.includes("7")) {
    workoutInsight = "Wow, daily workouts! Remember to prioritize recovery and rest days too.";
  } else if (workoutFreq.includes("5") || workoutFreq.includes("6")) {
    workoutInsight = "Great consistency with 5-6 sessions! Focus on compound movements for best results.";
  } else if (workoutFreq.includes("3") || workoutFreq.includes("4")) {
    workoutInsight = "3-4 sessions weekly is perfect for steady progress. Consider adding some cardio days.";
  } else {
    workoutInsight = "Every bit counts! Try to gradually increase your activity frequency.";
  }

  // Health score calculation
  let healthScore = 50;
  // Calorie balance score (0-30)
  const calorieScore = Math.max(0, 30 - Math.min(30, Math.abs(netCalories / 1000)));
  healthScore += calorieScore;
  // Hydration score (0-20)
  const hydrationScore = Math.min(20, avgWaterLiters * 8);
  healthScore += hydrationScore;
  // Streak bonus (0-20)
  const streakScore = Math.min(20, weeklySummary.streak * 2);
  healthScore += streakScore;
  // Cap at 100
  healthScore = Math.min(100, Math.round(healthScore));

  // Motivational quotes
  const motivations = [
    "Consistency is the key to unlocking your true potential. Keep showing up!",
    "Every small step counts. You're doing great!",
    "Progress, not perfection. Keep moving forward!",
    "You're stronger than you think. Keep pushing!",
    "Believe in yourself. You've got this!"
  ];
  const motivation = motivations[Math.floor(Math.random() * motivations.length)];

  return {
    calorieInsight,
    hydrationInsight,
    workoutInsight,
    healthScore,
    motivation
  };
}

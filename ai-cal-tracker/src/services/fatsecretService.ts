import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CLIENT_ID = "749ebc4ef24d46949b8614a2c7dc606d";
const CLIENT_SECRET = "91bad842563c44bfbf6cc31af352b264";
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

console.log("[FatSecret Init] CLIENT_ID length:", CLIENT_ID.length, "CLIENT_SECRET length:", CLIENT_SECRET.length);

// Generate nutrition data using Gemini for any food
async function generateNutritionWithGemini(query: string): Promise<FatSecretFood[]> {
  // First, always try mock data - it's fast and reliable!
  const lowerQuery = query.toLowerCase().trim();
  const mockResults = mockFoods.filter(food => 
    food.name.toLowerCase().includes(lowerQuery)
  );
  
  if (mockResults.length > 0) {
    return mockResults.slice(0, 8); // Return up to 8 matches
  }
  
  // If no mock matches, try Gemini (if available)
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Generate nutrition information for "${query}". Respond ONLY with a JSON array of 3-5 food items, each with: id (string), name (string), servingSize (string), calories (number), protein (number in grams), fats (number in grams), carbs (number in grams). No markdown, no extra text.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      let jsonText = text;
      
      // Clean up any markdown formatting
      if (text.startsWith("```json")) {
        jsonText = text.slice(7).trim();
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3).trim();
      }
      
      const foods = JSON.parse(jsonText);
      
      // Validate the response
      if (Array.isArray(foods) && foods.length > 0) {
        return foods.map((food, index) => ({
          id: food.id || `gemini-${index}`,
          name: food.name || query,
          servingSize: food.servingSize || "1 serving",
          calories: typeof food.calories === "number" ? food.calories : 100,
          protein: typeof food.protein === "number" ? food.protein : 5,
          fats: typeof food.fats === "number" ? food.fats : 5,
          carbs: typeof food.carbs === "number" ? food.carbs : 10,
        }));
      }
    } catch (error) {
      console.warn("[Gemini] Failed to generate nutrition data, using fallback", error);
    }
  }
  
  // Ultimate fallback: return a generic food item plus a few related mocks
  const genericFood: FatSecretFood = {
    id: "generic-1",
    name: `${query.charAt(0).toUpperCase() + query.slice(1)}`,
    servingSize: "1 serving",
    calories: 150,
    protein: 8,
    fats: 5,
    carbs: 20,
  };
  
  // Add a few more generic related foods
  const fallback: FatSecretFood[] = [
    genericFood,
    {
      id: "generic-2",
      name: `${query.charAt(0).toUpperCase() + query.slice(1)} (Small Portion)`,
      servingSize: "1 small serving",
      calories: 80,
      protein: 4,
      fats: 2.5,
      carbs: 10,
    },
    {
      id: "generic-3",
      name: `${query.charAt(0).toUpperCase() + query.slice(1)} (Large Portion)`,
      servingSize: "1 large serving",
      calories: 250,
      protein: 12,
      fats: 8,
      carbs: 30,
    },
  ];
  
  return fallback;
}

export interface FatSecretFood {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0; // timestamp in ms

// helper to encode credentials in base64 on all JS environments
function encodeBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < str.length; i += 3) {
    const c1 = str.charCodeAt(i);
    const c2 = i + 1 < str.length ? str.charCodeAt(i + 1) : NaN;
    const c3 = i + 2 < str.length ? str.charCodeAt(i + 2) : NaN;

    const byte1 = c1 >> 2;
    const byte2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const byte3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
    const byte4 = isNaN(c3) ? 64 : c3 & 63;

    output += chars.charAt(byte1) + chars.charAt(byte2) +
      (byte3 === 64 ? "=" : chars.charAt(byte3)) +
      (byte4 === 64 ? "=" : chars.charAt(byte4));
  }
  return output;
}

const mockFoods: FatSecretFood[] = [
  { id: "1", name: "Grilled Chicken Breast", servingSize: "100g", calories: 165, protein: 31, fats: 3.6, carbs: 0 },
  { id: "2", name: "Brown Rice", servingSize: "1 cup cooked", calories: 216, protein: 5, fats: 1.8, carbs: 45 },
  { id: "3", name: "Broccoli", servingSize: "1 cup", calories: 55, protein: 3.7, fats: 0.6, carbs: 11 },
  { id: "4", name: "Banana", servingSize: "1 medium", calories: 105, protein: 1.3, fats: 0.4, carbs: 27 },
  { id: "5", name: "Greek Yogurt", servingSize: "1 cup", calories: 100, protein: 17, fats: 0.7, carbs: 6 },
  { id: "6", name: "Egg", servingSize: "1 large", calories: 72, protein: 6, fats: 5, carbs: 0.4 },
  { id: "7", name: "Scrambled Eggs", servingSize: "2 eggs", calories: 180, protein: 12, fats: 12, carbs: 2 },
  { id: "8", name: "Apple", servingSize: "1 medium (182g)", calories: 95, protein: 0.5, fats: 0.3, carbs: 25 },
  { id: "9", name: "Apple Slices", servingSize: "1 cup", calories: 65, protein: 0.3, fats: 0.2, carbs: 17 },
  { id: "10", name: "Pizza", servingSize: "1 slice (107g)", calories: 285, protein: 12, fats: 10, carbs: 35 },
  { id: "11", name: "Salmon", servingSize: "100g", calories: 206, protein: 22, fats: 12, carbs: 0 },
  { id: "12", name: "Oatmeal", servingSize: "1 cup cooked", calories: 158, protein: 6, fats: 3, carbs: 27 },
  { id: "13", name: "Milk", servingSize: "1 cup (240ml)", calories: 150, protein: 8, fats: 8, carbs: 12 },
  { id: "14", name: "Bread", servingSize: "1 slice", calories: 80, protein: 3, fats: 1, carbs: 15 },
  { id: "15", name: "Cheese", servingSize: "1 slice (28g)", calories: 113, protein: 7, fats: 9, carbs: 0.4 },
  { id: "16", name: "Pasta", servingSize: "1 cup cooked", calories: 220, protein: 8, fats: 1.3, carbs: 43 },
  { id: "17", name: "Tomato", servingSize: "1 medium", calories: 22, protein: 1.1, fats: 0.2, carbs: 4.8 },
  { id: "18", name: "Lettuce", servingSize: "1 cup", calories: 5, protein: 0.5, fats: 0.1, carbs: 1 },
  { id: "19", name: "Carrot", servingSize: "1 medium", calories: 25, protein: 0.6, fats: 0.1, carbs: 6 },
  { id: "20", name: "Potato", servingSize: "1 medium", calories: 110, protein: 2.6, fats: 0.1, carbs: 26 },
  { id: "21", name: "Sweet Potato", servingSize: "1 medium", calories: 103, protein: 2, fats: 0.2, carbs: 24 },
  { id: "22", name: "Spinach", servingSize: "1 cup raw", calories: 7, protein: 0.9, fats: 0.1, carbs: 1 },
  { id: "23", name: "Kale", servingSize: "1 cup raw", calories: 33, protein: 2.9, fats: 0.5, carbs: 6 },
  { id: "24", name: "Avocado", servingSize: "1 medium", calories: 234, protein: 2.9, fats: 21, carbs: 12 },
  { id: "25", name: "Strawberry", servingSize: "1 cup", calories: 46, protein: 1, fats: 0.4, carbs: 11 },
  { id: "26", name: "Blueberry", servingSize: "1 cup", calories: 84, protein: 1.1, fats: 0.5, carbs: 21 },
  { id: "27", name: "Orange", servingSize: "1 medium", calories: 62, protein: 1.2, fats: 0.2, carbs: 15 },
  { id: "28", name: "Grapes", servingSize: "1 cup", calories: 62, protein: 0.6, fats: 0.3, carbs: 16 },
  { id: "29", name: "Watermelon", servingSize: "1 cup", calories: 46, protein: 0.9, fats: 0.2, carbs: 12 },
  { id: "30", name: "Chocolate", servingSize: "1 oz (28g)", calories: 155, protein: 1.3, fats: 9, carbs: 17 },
  { id: "31", name: "Cookie", servingSize: "1 medium", calories: 148, protein: 2, fats: 7, carbs: 21 },
  { id: "32", name: "Ice Cream", servingSize: "1/2 cup", calories: 137, protein: 2.3, fats: 7, carbs: 16 },
  { id: "33", name: "Coffee", servingSize: "1 cup black", calories: 2, protein: 0.3, fats: 0, carbs: 0 },
  { id: "34", name: "Tea", servingSize: "1 cup", calories: 2, protein: 0, fats: 0, carbs: 0.5 },
  { id: "35", name: "Soda", servingSize: "1 can (355ml)", calories: 149, protein: 0, fats: 0, carbs: 39 },
  { id: "36", name: "Juice", servingSize: "1 cup", calories: 112, protein: 0.8, fats: 0.2, carbs: 26 },
  { id: "37", name: "Beef", servingSize: "100g", calories: 250, protein: 26, fats: 15, carbs: 0 },
  { id: "38", name: "Pork", servingSize: "100g", calories: 242, protein: 26, fats: 14, carbs: 0 },
  { id: "39", name: "Turkey", servingSize: "100g", calories: 189, protein: 29, fats: 7, carbs: 0 },
  { id: "40", name: "Shrimp", servingSize: "100g", calories: 99, protein: 21, fats: 1.7, carbs: 0.2 },
  { id: "41", name: "Tuna", servingSize: "100g canned in water", calories: 132, protein: 28, fats: 0.8, carbs: 0 },
  { id: "42", name: "Lentils", servingSize: "1 cup cooked", calories: 230, protein: 18, fats: 0.8, carbs: 40 },
  { id: "43", name: "Chickpeas", servingSize: "1 cup", calories: 269, protein: 14.5, fats: 4.3, carbs: 45 },
  { id: "44", name: "Black Beans", servingSize: "1 cup", calories: 227, protein: 15.2, fats: 0.9, carbs: 40.8 },
  { id: "45", name: "Peanut Butter", servingSize: "2 tbsp (32g)", calories: 188, protein: 7.7, fats: 16, carbs: 7 },
  { id: "46", name: "Almonds", servingSize: "1 oz (28g)", calories: 164, protein: 6, fats: 14, carbs: 6 },
  { id: "47", name: "Walnuts", servingSize: "1 oz (28g)", calories: 185, protein: 4.3, fats: 18, carbs: 3.9 },
  { id: "48", name: "Olive Oil", servingSize: "1 tbsp", calories: 119, protein: 0, fats: 13.5, carbs: 0 },
  { id: "49", name: "Butter", servingSize: "1 tbsp", calories: 102, protein: 0.1, fats: 11.5, carbs: 0.1 },
  { id: "50", name: "Honey", servingSize: "1 tbsp", calories: 64, protein: 0.1, fats: 0, carbs: 17.3 },
  { id: "51", name: "Sugar", servingSize: "1 tsp", calories: 16, protein: 0, fats: 0, carbs: 4.2 },
  { id: "52", name: "Rice", servingSize: "1 cup white cooked", calories: 206, protein: 4.3, fats: 0.4, carbs: 45 },
  { id: "53", name: "Quinoa", servingSize: "1 cup cooked", calories: 222, protein: 8.1, fats: 4, carbs: 39 },
  { id: "54", name: "Couscous", servingSize: "1 cup cooked", calories: 177, protein: 6, fats: 0.3, carbs: 37 },
  { id: "55", name: "Oats", servingSize: "1 cup rolled oats", calories: 307, protein: 10.7, fats: 5.3, carbs: 54 },
  { id: "56", name: "Cereal", servingSize: "1 cup", calories: 120, protein: 3, fats: 1, carbs: 26 },
  { id: "57", name: "Bagel", servingSize: "1 medium", calories: 277, protein: 11, fats: 1.7, carbs: 55 },
  { id: "58", name: "Croissant", servingSize: "1 medium", calories: 231, protein: 4.7, fats: 12, carbs: 26 },
  { id: "59", name: "Muffin", servingSize: "1 medium", calories: 340, protein: 5, fats: 12, carbs: 54 },
  { id: "60", name: "Pancakes", servingSize: "2 medium", calories: 180, protein: 5, fats: 3, carbs: 34 },
  { id: "61", name: "Waffles", servingSize: "2 medium", calories: 218, protein: 5.9, fats: 7.3, carbs: 33 },
  { id: "62", name: "French Toast", servingSize: "2 slices", calories: 300, protein: 10, fats: 12, carbs: 33 },
  { id: "63", name: "Bacon", servingSize: "3 slices", calories: 129, protein: 7.6, fats: 10.4, carbs: 0.6 },
  { id: "64", name: "Sausage", servingSize: "1 link", calories: 88, protein: 4.3, fats: 7.5, carbs: 1.3 },
  { id: "65", name: "Ham", servingSize: "3 oz (85g)", calories: 137, protein: 17, fats: 6.4, carbs: 1.2 },
  { id: "66", name: "Turkey Bacon", servingSize: "3 slices", calories: 70, protein: 6, fats: 4.5, carbs: 1 },
  { id: "67", name: "Hot Dog", servingSize: "1 frankfurter", calories: 151, protein: 5.3, fats: 13.3, carbs: 1.8 },
  { id: "68", name: "Hamburger", servingSize: "1 patty (113g)", calories: 250, protein: 20, fats: 19, carbs: 0 },
  { id: "69", name: "Cheeseburger", servingSize: "1 sandwich", calories: 520, protein: 28, fats: 30, carbs: 34 },
  { id: "70", name: "French Fries", servingSize: "1 medium", calories: 378, protein: 4.3, fats: 17, carbs: 52 },
  { id: "71", name: "Taco", servingSize: "1 soft shell", calories: 170, protein: 8, fats: 9, carbs: 14 },
  { id: "72", name: "Burrito", servingSize: "1 large", calories: 660, protein: 29, fats: 31, carbs: 67 },
  { id: "73", name: "Tortilla", servingSize: "1 medium", calories: 105, protein: 2.6, fats: 2.7, carbs: 18 },
  { id: "74", name: "Nachos", servingSize: "1 small order", calories: 346, protein: 9.8, fats: 21, carbs: 32 },
  { id: "75", name: "Salsa", servingSize: "2 tbsp", calories: 9, protein: 0.3, fats: 0.1, carbs: 2 },
  { id: "76", name: "Guacamole", servingSize: "2 tbsp", calories: 46, protein: 0.6, fats: 4.2, carbs: 2.5 },
  { id: "77", name: "Hummus", servingSize: "2 tbsp", calories: 70, protein: 2.5, fats: 5, carbs: 4.5 },
  { id: "78", name: "Falafel", servingSize: "3 pieces", calories: 170, protein: 6.5, fats: 8.5, carbs: 17.5 },
  { id: "79", name: "Pita Bread", servingSize: "1 small", calories: 102, protein: 4, fats: 0.8, carbs: 20 },
  { id: "80", name: "Salad", servingSize: "1 side salad", calories: 100, protein: 3, fats: 5, carbs: 10 },
  { id: "81", name: "Caesar Salad", servingSize: "1 cup", calories: 190, protein: 6, fats: 16, carbs: 6 },
  { id: "82", name: "Greek Salad", servingSize: "1 cup", calories: 120, protein: 3, fats: 8, carbs: 8 },
  { id: "83", name: "Fruit Salad", servingSize: "1 cup", calories: 125, protein: 1, fats: 0.5, carbs: 31 },
  { id: "84", name: "Coleslaw", servingSize: "1 cup", calories: 160, protein: 1.5, fats: 12, carbs: 12 },
  { id: "85", name: "Potato Salad", servingSize: "1 cup", calories: 280, protein: 3.5, fats: 19, carbs: 25 },
  { id: "86", name: "Mac and Cheese", servingSize: "1 cup", calories: 310, protein: 11, fats: 15, carbs: 33 },
  { id: "87", name: "Lasagna", servingSize: "1 piece", calories: 408, protein: 22, fats: 21, carbs: 32 },
  { id: "88", name: "Spaghetti", servingSize: "1 cup with sauce", calories: 293, protein: 9, fats: 8.5, carbs: 43 },
  { id: "89", name: "Meatballs", servingSize: "4 small", calories: 210, protein: 14, fats: 15, carbs: 5 },
  { id: "90", name: "Soup", servingSize: "1 cup", calories: 100, protein: 5, fats: 3, carbs: 12 },
  { id: "91", name: "Chicken Soup", servingSize: "1 cup", calories: 120, protein: 9, fats: 3, carbs: 12 },
  { id: "92", name: "Tomato Soup", servingSize: "1 cup", calories: 102, protein: 3.2, fats: 1.8, carbs: 18.6 },
  { id: "93", name: "Vegetable Soup", servingSize: "1 cup", calories: 80, protein: 3, fats: 2, carbs: 13 },
  { id: "94", name: "Minestrone", servingSize: "1 cup", calories: 110, protein: 4, fats: 3, carbs: 17 },
  { id: "95", name: "Sandwich", servingSize: "1 medium", calories: 300, protein: 15, fats: 10, carbs: 35 },
  { id: "96", name: "Grilled Cheese", servingSize: "1 sandwich", calories: 350, protein: 12, fats: 18, carbs: 33 },
  { id: "97", name: "Turkey Sandwich", servingSize: "1 sandwich", calories: 320, protein: 20, fats: 8, carbs: 35 },
  { id: "98", name: "BLT", servingSize: "1 sandwich", calories: 400, protein: 14, fats: 23, carbs: 33 },
  { id: "99", name: "Wrap", servingSize: "1 large", calories: 380, protein: 18, fats: 15, carbs: 40 },
  { id: "100", name: "Fries", servingSize: "1 small order", calories: 230, protein: 3, fats: 11, carbs: 30 },
];

// Keep track of whether the proxy is available
let proxyAvailable: boolean | null = null;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // On Web, try proxy if it's known to be available, else use mock
  if (Platform.OS === "web") {
    if (proxyAvailable !== false) {
      try {
        console.log("[FatSecret Service] Checking proxy availability...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout for proxy check
        const response = await fetch("http://localhost:4000/api/token", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          proxyAvailable = true;
          const data = await response.json();
          return data.access_token;
        }
      } catch (err) {
        proxyAvailable = false;
        // Don't log this as an error - it's expected when proxy isn't running
        console.debug("[FatSecret] Proxy not available, using mock data");
      }
    }
    return "dummy_token_for_mock_data";
  }

  // Direct native flow (no CORS restrictions on native iOS/Android devices):
  if (cachedToken && tokenExpiryTime > now + 60000) {
    return cachedToken;
  }

  try {
    const storedToken = await AsyncStorage.getItem("fatsecret_token");
    const storedExpiry = await AsyncStorage.getItem("fatsecret_token_expiry");

    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      if (expiry > now + 60000) {
        cachedToken = storedToken;
        tokenExpiryTime = expiry;
        return storedToken;
      }
    }
  } catch (err) {
    console.warn("[FatSecret] Failed to read token from AsyncStorage", err);
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("FatSecret credentials missing. Please check .env file.");
  }

  console.log("[FatSecret] Fetching new access token...");
  const authHeader = "Basic " + encodeBase64(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authHeader,
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`FatSecret authentication failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const token = data.access_token;
  const expiresInMs = (data.expires_in || 86400) * 1000;
  const expiryTimestamp = Date.now() + expiresInMs;

  cachedToken = token;
  tokenExpiryTime = expiryTimestamp;

  try {
    await AsyncStorage.setItem("fatsecret_token", token);
    await AsyncStorage.setItem("fatsecret_token_expiry", expiryTimestamp.toString());
  } catch (err) {
    console.warn("[FatSecret] Failed to save token to AsyncStorage", err);
  }

  return token;
}

function parseFoodDescription(desc: string): { servingSize: string; calories: number; fats: number; carbs: number; protein: number } {
  let servingSize = "1 serving";
  let calories = 0;
  let fats = 0;
  let carbs = 0;
  let protein = 0;

  try {
    const parts = desc.split(" - ");
    if (parts.length > 0) {
      servingSize = parts[0].replace(/^Per\s+/i, "").trim();
    }
    if (parts.length > 1) {
      const nutrientStr = parts[1];

      const calMatch = nutrientStr.match(/Calories:\s*(\d+(?:\.\d+)?)\s*kcal/i);
      if (calMatch) calories = Math.round(parseFloat(calMatch[1]));

      const fatMatch = nutrientStr.match(/Fat:\s*(\d+(?:\.\d+)?)\s*g/i);
      if (fatMatch) fats = parseFloat(fatMatch[1]);

      const carbMatch = nutrientStr.match(/Carbs:\s*(\d+(?:\.\d+)?)\s*g/i);
      if (carbMatch) carbs = parseFloat(carbMatch[1]);

      const proteinMatch = nutrientStr.match(/Protein:\s*(\d+(?:\.\d+)?)\s*g/i);
      if (proteinMatch) protein = parseFloat(proteinMatch[1]);
    }
  } catch (e) {
    console.warn("[FatSecret] Error parsing food description:", desc, e);
  }

  return { servingSize, calories, fats, carbs, protein };
}

export async function searchFoods(query: string): Promise<FatSecretFood[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    // If we are on web and proxy is available, use it first
    if (Platform.OS === "web" && proxyAvailable !== false) {
      try {
        console.log("[FatSecret Service] Searching via CORS proxy...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        const url = `http://localhost:4000/api/foods/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const foodsContainer = data?.foods;
          if (foodsContainer && foodsContainer.food) {
            const foodArray = Array.isArray(foodsContainer.food)
              ? foodsContainer.food
              : [foodsContainer.food];
            return foodArray.slice(0, 5).map((item: any) => {
              const desc = item.food_description || "";
              const parsedNutrients = parseFoodDescription(desc);
              return {
                id: item.food_id,
                name: item.food_name,
                servingSize: parsedNutrients.servingSize,
                calories: parsedNutrients.calories,
                protein: parsedNutrients.protein,
                fats: parsedNutrients.fats,
                carbs: parsedNutrients.carbs,
              };
            });
          }
        }
      } catch (err) {
        proxyAvailable = false;
        console.debug("[FatSecret] Proxy search failed");
      }
    } 
    // If proxy not available or not on web, try native flow
    else if (Platform.OS !== "web") {
      try {
        const token = await getAccessToken();
        const url = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&max_results=5`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const foodsContainer = data?.foods;
          if (foodsContainer && foodsContainer.food) {
            const foodArray = Array.isArray(foodsContainer.food)
              ? foodsContainer.food
              : [foodsContainer.food];
            return foodArray.slice(0, 5).map((item: any) => {
              const desc = item.food_description || "";
              const parsedNutrients = parseFoodDescription(desc);
              return {
                id: item.food_id,
                name: item.food_name,
                servingSize: parsedNutrients.servingSize,
                calories: parsedNutrients.calories,
                protein: parsedNutrients.protein,
                fats: parsedNutrients.fats,
                carbs: parsedNutrients.carbs,
              };
            });
          }
        }
      } catch (err) {
        console.warn("[FatSecret] Native search failed");
      }
    }

    // If all else fails, use Gemini to generate nutrition data!
    return await generateNutritionWithGemini(query);
  } catch (error) {
    console.error("[FatSecret] Search error:", error);
    // Fallback to Gemini for any error
    return await generateNutritionWithGemini(query);
  }
}

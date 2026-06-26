import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ONLY use FatSecret API credentials
const CLIENT_ID = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || "";
const CLIENT_SECRET = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET || "";

console.log("[FatSecret Init] CLIENT_ID set:", !!CLIENT_ID, "CLIENT_SECRET set:", !!CLIENT_SECRET);

export interface FatSecretFood {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

// Comprehensive Indian Food Static Dataset (Production Grade)
const INDIAN_FOODS: FatSecretFood[] = [
  // Rotis & Breads
  { id: "roti", name: "Chapati / Roti", servingSize: "1 piece (40g)", calories: 118, protein: 3.4, fats: 2.8, carbs: 20.1 },
  { id: "paratha", name: "Aloo Paratha", servingSize: "1 piece (100g)", calories: 315, protein: 6.2, fats: 13.8, carbs: 41.5 },
  { id: "naan", name: "Butter Naan", servingSize: "1 piece (80g)", calories: 298, protein: 7.8, fats: 11.5, carbs: 39.7 },
  { id: "kulcha", name: "Paneer Kulcha", servingSize: "1 piece (100g)", calories: 345, protein: 9.8, fats: 14.7, carbs: 44.8 },
  { id: "poori", name: "Poori", servingSize: "1 piece (30g)", calories: 128, protein: 2.4, fats: 6.9, carbs: 14.8 },
  { id: "bhatura", name: "Bhatura", servingSize: "1 piece (100g)", calories: 398, protein: 6.9, fats: 17.9, carbs: 54.5 },
  { id: "tandoori-roti", name: "Tandoori Roti", servingSize: "1 piece (50g)", calories: 150, protein: 4.2, fats: 3.8, carbs: 25.5 },
  { id: "laccha-paratha", name: "Laccha Paratha", servingSize: "1 piece (100g)", calories: 330, protein: 5.8, fats: 15, carbs: 43.5 },

  // Rice Dishes
  { id: "rice", name: "Plain Boiled Rice", servingSize: "1 cup (180g cooked)", calories: 198, protein: 4.1, fats: 0.4, carbs: 44.8 },
  { id: "jeera-rice", name: "Jeera Rice", servingSize: "1 cup (180g cooked)", calories: 218, protein: 4.1, fats: 5.2, carbs: 44.7 },
  { id: "fried-rice", name: "Veg Fried Rice", servingSize: "1 cup (200g)", calories: 298, protein: 6.2, fats: 9.9, carbs: 48.2 },
  { id: "biryani", name: "Veg Biryani", servingSize: "1 cup (250g)", calories: 448, protein: 11.8, fats: 17.8, carbs: 59.8 },
  { id: "chicken-biryani", name: "Chicken Biryani", servingSize: "1 cup (250g)", calories: 548, protein: 24.8, fats: 21.9, carbs: 54.8 },
  { id: "curd-rice", name: "Curd Rice", servingSize: "1 cup (200g)", calories: 248, protein: 8.2, fats: 7.8, carbs: 34.8 },
  { id: "khichdi", name: "Dal Khichdi", servingSize: "1 cup (200g)", calories: 278, protein: 9.8, fats: 5.9, carbs: 47.8 },
  { id: "lemon-rice", name: "Lemon Rice", servingSize: "1 cup (180g)", calories: 230, protein: 3.8, fats: 6.5, carbs: 42 },
  { id: "tamarind-rice", name: "Tamarind Rice / Puliyogare", servingSize: "1 cup (180g)", calories: 245, protein: 4.2, fats: 7.8, carbs: 41 },

  // Dal & Lentils
  { id: "dal", name: "Plain Dal (Toor/Arhar)", servingSize: "1 small bowl (150g)", calories: 178, protein: 9.8, fats: 4.9, carbs: 24.8 },
  { id: "dal-tadka", name: "Dal Tadka", servingSize: "1 small bowl (150g)", calories: 218, protein: 9.8, fats: 9.8, carbs: 24.8 },
  { id: "dal-makhani", name: "Dal Makhani", servingSize: "1 small bowl (150g)", calories: 348, protein: 11.8, fats: 19.8, carbs: 29.8 },
  { id: "rajma", name: "Rajma (Kidney Beans)", servingSize: "1 small bowl (150g)", calories: 278, protein: 13.8, fats: 7.8, carbs: 34.8 },
  { id: "chole", name: "Chole (Chickpeas)", servingSize: "1 small bowl (150g)", calories: 288, protein: 11.9, fats: 9.9, carbs: 37.8 },
  { id: "moong-dal", name: "Green Moong Dal", servingSize: "1 small bowl (150g)", calories: 158, protein: 9.8, fats: 2.9, carbs: 23.8 },
  { id: "masoor-dal", name: "Red Lentil / Masoor Dal", servingSize: "1 small bowl (150g)", calories: 165, protein: 8.5, fats: 3.2, carbs: 25 },
  { id: "urad-dal", name: "Black Urad Dal", servingSize: "1 small bowl (150g)", calories: 190, protein: 9.5, fats: 5, carbs: 27 },

  // Vegetable Curries
  { id: "aloo-gobi", name: "Aloo Gobi", servingSize: "1 small bowl (150g)", calories: 178, protein: 3.8, fats: 9.8, carbs: 19.8 },
  { id: "bhindi", name: "Bhindi Fry", servingSize: "1 small bowl (100g)", calories: 148, protein: 2.8, fats: 9.8, carbs: 11.8 },
  { id: "palak-paneer", name: "Palak Paneer", servingSize: "1 small bowl (150g)", calories: 278, protein: 13.8, fats: 21.8, carbs: 9.8 },
  { id: "shahi-paneer", name: "Shahi Paneer", servingSize: "1 small bowl (150g)", calories: 378, protein: 11.8, fats: 29.8, carbs: 14.8 },
  { id: "mixed-veg", name: "Mixed Vegetable Curry", servingSize: "1 small bowl (150g)", calories: 158, protein: 3.8, fats: 7.8, carbs: 19.8 },
  { id: "baingan-bharta", name: "Baingan Bharta", servingSize: "1 small bowl (150g)", calories: 138, protein: 2.8, fats: 9.8, carbs: 9.8 },
  { id: "aloo-matar", name: "Aloo Matar", servingSize: "1 small bowl (150g)", calories: 165, protein: 4.2, fats: 9, carbs: 19 },
  { id: "karela", name: "Karela / Bitter Gourd Fry", servingSize: "1 small bowl (100g)", calories: 110, protein: 3, fats: 7, carbs: 10 },
  { id: "lauki", name: "Lauki / Bottle Gourd Curry", servingSize: "1 small bowl (150g)", calories: 120, protein: 3.5, fats: 5, carbs: 16 },

  // Paneer & Dairy
  { id: "paneer", name: "Paneer", servingSize: "100g", calories: 288, protein: 17.8, fats: 21.8, carbs: 2.8 },
  { id: "curd", name: "Curd / Yogurt (plain)", servingSize: "1 small bowl (100g)", calories: 98, protein: 9.8, fats: 3.8, carbs: 5.8 },
  { id: "butter", name: "Butter", servingSize: "1 tbsp (14g)", calories: 98, protein: 0.4, fats: 10.8, carbs: 0.1 },
  { id: "ghee", name: "Ghee", servingSize: "1 tbsp (14g)", calories: 112, protein: 0, fats: 12.7, carbs: 0 },
  { id: "milk", name: "Milk (full cream)", servingSize: "1 glass (200ml)", calories: 148, protein: 7.8, fats: 7.8, carbs: 9.8 },
  { id: "lassi", name: "Sweet Lassi", servingSize: "1 glass (200ml)", calories: 218, protein: 7.8, fats: 5.8, carbs: 29.8 },
  { id: "cheese-slice", name: "Cheese Slice (Amul)", servingSize: "1 slice (20g)", calories: 70, protein: 4, fats: 5.5, carbs: 1 },

  // Chicken & Meat
  { id: "chicken-curry", name: "Chicken Curry", servingSize: "1 small bowl (150g)", calories: 278, protein: 24.8, fats: 17.8, carbs: 4.8 },
  { id: "tandoori-chicken", name: "Tandoori Chicken", servingSize: "1 piece (100g)", calories: 188, protein: 25.8, fats: 7.8, carbs: 1.8 },
  { id: "butter-chicken", name: "Butter Chicken", servingSize: "1 small bowl (150g)", calories: 348, protein: 21.8, fats: 27.8, carbs: 7.8 },
  { id: "mutton-curry", name: "Mutton Curry", servingSize: "1 small bowl (150g)", calories: 378, protein: 27.8, fats: 29.8, carbs: 4.8 },
  { id: "fish-curry", name: "Fish Curry", servingSize: "1 small bowl (150g)", calories: 248, protein: 27.8, fats: 13.8, carbs: 3.8 },
  { id: "chicken-tikka", name: "Chicken Tikka", servingSize: "1 piece (50g)", calories: 90, protein: 12, fats: 4, carbs: 1.5 },

  // Snacks & Street Food
  { id: "samosa", name: "Samosa", servingSize: "1 piece (50g)", calories: 258, protein: 3.8, fats: 15.8, carbs: 27.8 },
  { id: "pakora", name: "Onion Pakora", servingSize: "1 piece (30g)", calories: 138, protein: 1.8, fats: 9.8, carbs: 11.8 },
  { id: "vada-pav", name: "Vada Pav", servingSize: "1 piece (100g)", calories: 298, protein: 5.8, fats: 13.8, carbs: 39.8 },
  { id: "bhel-puri", name: "Bhel Puri", servingSize: "1 plate (100g)", calories: 198, protein: 2.8, fats: 7.8, carbs: 29.8 },
  { id: "pani-puri", name: "Pani Puri / Golgappa", servingSize: "1 piece (20g)", calories: 38, protein: 0.4, fats: 1.8, carbs: 4.8 },
  { id: "pav-bhaji", name: "Pav Bhaji", servingSize: "1 plate (200g)", calories: 448, protein: 7.8, fats: 19.8, carbs: 59.8 },
  { id: "chole-bhature", name: "Chole Bhature", servingSize: "1 plate (300g)", calories: 848, protein: 14.8, fats: 39.8, carbs: 109.8 },
  { id: "dhokla", name: "Dhokla", servingSize: "1 piece (50g)", calories: 70, protein: 3, fats: 2, carbs: 12 },
  { id: "khandvi", name: "Khandvi", servingSize: "1 piece (30g)", calories: 60, protein: 3, fats: 3.5, carbs: 4 },

  // Sweets & Desserts
  { id: "gulab-jamun", name: "Gulab Jamun", servingSize: "1 piece (30g)", calories: 148, protein: 1.8, fats: 5.8, carbs: 21.8 },
  { id: "jalebi", name: "Jalebi", servingSize: "1 piece (20g)", calories: 98, protein: 0.8, fats: 4.8, carbs: 12.8 },
  { id: "ladoo", name: "Besan Ladoo", servingSize: "1 piece (25g)", calories: 128, protein: 1.8, fats: 6.8, carbs: 14.8 },
  { id: "barfi", name: "Kaju Katli", servingSize: "1 piece (20g)", calories: 98, protein: 1.8, fats: 4.8, carbs: 11.8 },
  { id: "halwa", name: "Suji Halwa", servingSize: "1 small bowl (100g)", calories: 278, protein: 2.8, fats: 14.8, carbs: 34.8 },
  { id: "kheer", name: "Rice Kheer", servingSize: "1 small bowl (150g)", calories: 248, protein: 5.8, fats: 9.8, carbs: 34.8 },
  { id: "rasgulla", name: "Rasgulla", servingSize: "1 piece (20g)", calories: 48, protein: 0.8, fats: 0.4, carbs: 10.8 },
  { id: "gajar-halwa", name: "Gajar Ka Halwa", servingSize: "1 small bowl (100g)", calories: 220, protein: 4, fats: 10, carbs: 30 },
  { id: "rasmalai", name: "Rasmalai", servingSize: "1 piece (30g)", calories: 80, protein: 4, fats: 3, carbs: 9 },

  // Drinks & Beverages
  { id: "chai", name: "Indian Chai (with milk/sugar)", servingSize: "1 cup (150ml)", calories: 98, protein: 2.8, fats: 2.8, carbs: 13.8 },
  { id: "coffee", name: "Coffee (with milk/sugar)", servingSize: "1 cup (150ml)", calories: 118, protein: 2.8, fats: 3.8, carbs: 15.8 },
  { id: "nimbu-pani", name: "Nimbu Pani (sweet)", servingSize: "1 glass (200ml)", calories: 118, protein: 0.4, fats: 0, carbs: 29.8 },
  { id: "coconut-water", name: "Coconut Water", servingSize: "1 glass (200ml)", calories: 38, protein: 0.8, fats: 0, carbs: 8.8 },
  { id: "buttermilk", name: "Buttermilk / Chaas", servingSize: "1 glass (200ml)", calories: 48, protein: 3.8, fats: 0.8, carbs: 5.8 },
  { id: "badam-milk", name: "Badam Milk", servingSize: "1 glass (200ml)", calories: 180, protein: 5, fats: 8, carbs: 22 },
  { id: "jaljeera", name: "Jaljeera", servingSize: "1 glass (200ml)", calories: 30, protein: 0.5, fats: 0, carbs: 7 },

  // Breakfast
  { id: "idli", name: "Idli", servingSize: "2 pieces (100g)", calories: 158, protein: 4.8, fats: 1.8, carbs: 31.8 },
  { id: "dosa", name: "Plain Dosa", servingSize: "1 piece (100g)", calories: 198, protein: 3.8, fats: 7.8, carbs: 27.8 },
  { id: "masala-dosa", name: "Masala Dosa", servingSize: "1 piece (150g)", calories: 348, protein: 6.8, fats: 14.8, carbs: 47.8 },
  { id: "uttapam", name: "Uttapam", servingSize: "1 piece (120g)", calories: 248, protein: 5.8, fats: 9.8, carbs: 34.8 },
  { id: "upma", name: "Upma", servingSize: "1 small bowl (150g)", calories: 278, protein: 5.8, fats: 11.8, carbs: 37.8 },
  { id: "poha", name: "Poha", servingSize: "1 small bowl (150g)", calories: 238, protein: 4.8, fats: 9.8, carbs: 34.8 },
  { id: "parantha-breakfast", name: "Paneer Paratha (breakfast)", servingSize: "1 piece (120g)", calories: 398, protein: 11.8, fats: 19.8, carbs: 47.8 },
  { id: "medu-vada", name: "Medu Vada", servingSize: "1 piece (50g)", calories: 130, protein: 4, fats: 7, carbs: 14 },

  // Other Dishes
  { id: "sambar", name: "Sambar", servingSize: "1 small bowl (150g)", calories: 148, protein: 5.8, fats: 4.8, carbs: 19.8 },
  { id: "rasam", name: "Rasam", servingSize: "1 small bowl (150g)", calories: 98, protein: 2.8, fats: 3.8, carbs: 14.8 },
  { id: "papad", name: "Papad (fried)", servingSize: "1 piece (10g)", calories: 58, protein: 1.8, fats: 3.8, carbs: 4.8 },
  { id: "achar", name: "Mango Achar", servingSize: "1 tbsp (15g)", calories: 28, protein: 0.4, fats: 1.8, carbs: 2.8 },
  { id: "chutney", name: "Coconut Chutney", servingSize: "2 tbsp (30g)", calories: 78, protein: 1.8, fats: 6.8, carbs: 2.8 },
  { id: "fried-fish", name: "Fried Fish", servingSize: "1 piece (100g)", calories: 260, protein: 25, fats: 16, carbs: 2 },
];

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0; // timestamp in ms

// Helper to encode credentials in base64 (works across all JS environments)
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

/**
 * Gets a valid FatSecret OAuth 2.0 access token (caches for 24 hours)
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Check cached in-memory token first (with 1-minute buffer)
  if (cachedToken && tokenExpiryTime > now + 60000) {
    return cachedToken;
  }

  // Check AsyncStorage for cached token
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

  // Validate credentials
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("FatSecret API credentials missing! Please set EXPO_PUBLIC_FATSECRET_CLIENT_ID and EXPO_PUBLIC_FATSECRET_CLIENT_SECRET in your .env file.");
  }

  console.log("[FatSecret] Fetching new access token...");
  const authHeader = "Basic " + encodeBase64(`${CLIENT_ID}:${CLIENT_SECRET}`);

  // Get new token from FatSecret OAuth 2.0 endpoint
  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authHeader,
    },
    body: "grant_type=client_credentials&scope=basic", // "basic" scope is for food search
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`FatSecret authentication failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const token = data.access_token;
  const expiresInMs = (data.expires_in || 86400) * 1000; // Default 24 hours
  const expiryTimestamp = Date.now() + expiresInMs;

  // Cache the new token
  cachedToken = token;
  tokenExpiryTime = expiryTimestamp;

  // Save to AsyncStorage for future app sessions
  try {
    await AsyncStorage.setItem("fatsecret_token", token);
    await AsyncStorage.setItem("fatsecret_token_expiry", expiryTimestamp.toString());
  } catch (err) {
    console.warn("[FatSecret] Failed to save token to AsyncStorage", err);
  }

  return token;
}

/**
 * Search FatSecret food database + Indian static food fallback
 */
export async function searchFoods(query: string): Promise<FatSecretFood[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  let results: FatSecretFood[] = [];

  // First, try FatSecret API
  if (Platform.OS !== "web") {
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

          // Parse FatSecret foods
          const fatSecretResults = foodArray.slice(0, 5).map((item: any) => {
            let calories = 0, protein = 0, fats = 0, carbs = 0, servingSize = "1 serving";
            
            if (item.food_description) {
              const desc = item.food_description;
              const parts = desc.split(" - ");
              if (parts.length > 0) {
                servingSize = parts[0].replace(/^Per\s+/i, "").trim();
              }
              
              const nutrientStr = parts.length > 1 ? parts[1] : desc;
              
              const calMatch = nutrientStr.match(/Calories:\s*(\d+(?:\.\d+)?)\s*kcal/i);
              const fatMatch = nutrientStr.match(/Fat:\s*(\d+(?:\.\d+)?)\s*g/i);
              const carbMatch = nutrientStr.match(/Carbs:\s*(\d+(?:\.\d+)?)\s*g/i);
              const proteinMatch = nutrientStr.match(/Protein:\s*(\d+(?:\.\d+)?)\s*g/i);
              
              if (calMatch) calories = Math.round(parseFloat(calMatch[1]));
              if (fatMatch) fats = parseFloat(fatMatch[1]);
              if (carbMatch) carbs = parseFloat(carbMatch[1]);
              if (proteinMatch) protein = parseFloat(proteinMatch[1]);
            }

            return {
              id: item.food_id?.toString() || `${Date.now()}-${Math.random()}`,
              name: item.food_name || query,
              servingSize,
              calories,
              protein,
              fats,
              carbs,
            };
          });
          results = fatSecretResults;
        }
      }
    } catch (error) {
      console.warn("[FatSecret] API call failed, using static data instead:", error);
    }
  }

  // If no results from FatSecret, use static Indian food dataset
  if (results.length === 0) {
    const staticResults = INDIAN_FOODS.filter(food => 
      food.name.toLowerCase().includes(lowerQuery)
    );
    results = staticResults.slice(0, 5);
  }

  return results;
}

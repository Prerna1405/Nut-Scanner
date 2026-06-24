import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

interface NutritionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const staticResponses: Record<string, string> = {
  "hello": "Hello! I'm here to help you with your nutrition and fitness goals. What would you like to know today?",
  "hi": "Hi there! How can I assist you on your health and wellness journey today?",
  "how to lose weight": "To lose weight healthily, focus on creating a moderate calorie deficit, eat plenty of protein and vegetables, stay hydrated, and get regular exercise. Aim for 0.5-1kg per week for sustainable results.",
  "how to gain weight": "To gain weight, eat a slight calorie surplus with plenty of protein (1.6-2.2g per kg of body weight), focus on whole foods, and do strength training 3-4 times per week.",
  "what to eat": "Focus on whole, unprocessed foods: lean proteins (chicken, fish, tofu), complex carbs (oats, brown rice, sweet potatoes), healthy fats (avocado, nuts), and lots of vegetables.",
  "protein": "Protein is essential for muscle repair and growth. Good sources include chicken, turkey, fish, eggs, tofu, lentils, and Greek yogurt.",
  "water": "Aim for 30-35ml of water per kg of body weight daily. More if you exercise a lot or in a hot climate.",
  "exercise": "Regular exercise improves health and fitness. Combine cardio and strength training for best results.",
  "sleep": "Aim for 7-9 hours of quality sleep per night for recovery and hormone balance.",
  "calories": "Calories are units of energy. Your daily needs depend on age, gender, weight, activity level, and goals.",
  "carbs": "Carbs are your body's main energy source. Choose complex carbs like whole grains, fruits, and vegetables.",
  "fats": "Healthy fats are important for hormone production and nutrient absorption. Include avocados, nuts, seeds, and olive oil.",
  "meal": "A balanced meal includes protein, carbs, and vegetables. For example: grilled chicken, brown rice, and broccoli.",
  "breakfast": "Try oatmeal with berries and nuts, or eggs with whole grain toast and avocado.",
  "lunch": "A salad with grilled chicken or tofu, lots of vegetables, and whole grain rice or quinoa.",
  "dinner": "Baked fish, sweet potato, and steamed vegetables, or a tofu stir-fry.",
  "snack": "Healthy snacks include Greek yogurt, nuts, fruit, or carrot sticks with hummus.",
  "workout": "Aim for 150 minutes of moderate cardio per week plus 2-3 strength training sessions.",
  "default": "Great question! Here are some general tips: Eat balanced meals with protein, carbs, and fats, stay hydrated, get enough sleep, and be consistent with your habits. Remember, everyone is different, so find what works best for your body and lifestyle!",
  "bmi": "BMI (Body Mass Index) is calculated using your height and weight. A BMI between 18.5 and 24.9 is generally considered healthy for most adults.",

"healthy diet": "A healthy diet includes lean proteins, whole grains, fruits, vegetables, healthy fats, and plenty of water while limiting processed foods and added sugars.",

"muscle gain": "To build muscle, focus on strength training, eat enough protein, maintain a calorie surplus, and ensure proper recovery between workouts.",

"fat loss": "Fat loss requires a calorie deficit, regular exercise, adequate protein intake, quality sleep, and consistency over time.",

"hydration": "Proper hydration supports digestion, energy levels, exercise performance, and overall health. Drink water consistently throughout the day.",

"vegetarian": "Vegetarian protein sources include lentils, beans, chickpeas, tofu, tempeh, Greek yogurt, milk, and nuts.",

"vegan": "Vegan protein sources include tofu, tempeh, edamame, lentils, beans, quinoa, nuts, and seeds.",

"fiber": "Fiber helps digestion, supports gut health, and promotes fullness. Good sources include fruits, vegetables, oats, legumes, and whole grains.",

"vitamins": "Vitamins are essential nutrients that support immunity, energy production, bone health, and overall wellness.",

"minerals": "Important minerals include calcium, iron, magnesium, potassium, and zinc which support various body functions.",

"energy": "Low energy can result from poor sleep, dehydration, inadequate nutrition, stress, or lack of physical activity.",

"motivation": "Focus on small daily improvements rather than perfection. Consistency is more important than motivation alone.",

"cheat meal": "An occasional treat meal is fine as part of a balanced lifestyle. Focus on overall weekly consistency rather than one meal.",

"sugar": "Excess added sugar may contribute to weight gain and energy crashes. Choose natural sources like fruits whenever possible.",

"fast food": "Fast food can fit occasionally into a balanced diet, but prioritize nutrient-dense whole foods most of the time.",

"running": "Running improves cardiovascular health, burns calories, and increases endurance. Start gradually and increase intensity over time.",

"walking": "Walking is a simple and effective way to improve fitness, burn calories, reduce stress, and support heart health.",

"strength training": "Strength training builds muscle, improves metabolism, increases bone density, and enhances overall fitness.",

"cardio": "Cardio exercises like running, cycling, swimming, and brisk walking improve heart and lung health.",

"yoga": "Yoga improves flexibility, balance, mobility, posture, and mental well-being while reducing stress.",

"stress": "Chronic stress can affect sleep, appetite, recovery, and overall health. Regular exercise and relaxation techniques can help.",

"mental health": "Physical activity, healthy eating, quality sleep, and social connections all contribute positively to mental health.",

"weight plateau": "Weight loss plateaus are common. Consider reviewing calorie intake, activity levels, sleep quality, and consistency.",

"meal prep": "Preparing meals in advance can help you stay consistent with your nutrition goals and avoid unhealthy choices.",

"healthy snacks": "Nutritious snacks include fruit, nuts, yogurt, boiled eggs, cottage cheese, and vegetables with hummus.",

"post workout": "After exercise, consume protein and carbohydrates to support recovery and replenish energy stores.",

"pre workout": "A pre-workout meal with carbohydrates and some protein can provide energy and improve performance.",

"recovery": "Recovery is essential for progress. Prioritize sleep, hydration, proper nutrition, and rest days.",

"immune system": "A strong immune system is supported by balanced nutrition, adequate sleep, exercise, hydration, and stress management.",

"cholesterol": "Healthy lifestyle habits such as exercise, consuming healthy fats, and eating more fiber can support heart health.",

"heart health": "Regular physical activity, healthy eating, maintaining a healthy weight, and avoiding smoking support heart health.",

"portion control": "Using smaller plates, eating slowly, and paying attention to hunger signals can help with portion control.",

"healthy habits": "Build sustainable habits such as regular exercise, meal planning, hydration, and adequate sleep.",

"consistency": "Long-term success comes from consistent healthy choices rather than short-term extreme diets.",

"goal setting": "Set realistic, measurable goals and track your progress regularly to stay motivated.",

"weight tracking": "Track your weight under similar conditions each time and focus on long-term trends rather than daily fluctuations.",

"water reminder": "Try drinking a glass of water when you wake up, before meals, and after workouts to stay hydrated.",

"sleep quality": "Improve sleep quality by maintaining a consistent schedule, limiting screen time before bed, and creating a relaxing environment.",

"healthy lifestyle": "A healthy lifestyle combines balanced nutrition, regular exercise, adequate sleep, stress management, and hydration."

};

function getStaticResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  if (staticResponses[lowerMsg]) {
    return staticResponses[lowerMsg];
  }
  for (const [key, response] of Object.entries(staticResponses)) {
    if (key !== "default" && lowerMsg.includes(key)) {
      return response;
    }
  }
  return staticResponses.default;
}

export async function sendNutritionQuery(
  conversationHistory: NutritionMessage[],
  userMessage: string,
  userProfile?: any
): Promise<NutritionMessage> {
  const staticResponse = getStaticResponse(userMessage);
  if (staticResponse !== staticResponses.default) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: staticResponse,
      timestamp: new Date(),
    };
  }

  if (!apiKey) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: staticResponses.default,
      timestamp: new Date(),
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    let systemPrompt = "You are a helpful, friendly, and knowledgeable nutrition coach. You provide personalized nutrition advice, meal suggestions, fitness tips, and answer questions about health and wellness. Keep your responses conversational, practical, and evidence-based. If you don't know something, be honest about it and suggest they consult a healthcare professional.\n\n";

    if (userProfile) {
      systemPrompt += "User profile context:\n";
      if (userProfile.gender) systemPrompt += `- Gender: ${userProfile.gender}\n`;
      if (userProfile.weight) systemPrompt += `- Weight: ${userProfile.weight} kg\n`;
      if (userProfile.heightFeet || userProfile.heightInches) {
        const totalInches = (userProfile.heightFeet || 0) * 12 + (userProfile.heightInches || 0);
        const cm = Math.round(totalInches * 2.54);
        systemPrompt += `- Height: ${cm} cm\n`;
      }
      if (userProfile.birthdate) {
        const birth = new Date(userProfile.birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        systemPrompt += `- Age: ${age}\n`;
      }
      if (userProfile.fitnessGoal) systemPrompt += `- Goal: ${userProfile.fitnessGoal}\n`;
      if (userProfile.activityLevel) systemPrompt += `- Activity: ${userProfile.activityLevel}\n`;
    }

    const history = conversationHistory.map(msg => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to help with your nutrition and fitness questions!" }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Nutrition coach error:", error);
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: getStaticResponse(userMessage),
      timestamp: new Date(),
    };
  }
}

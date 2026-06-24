import { Recipe, UserPreferences } from '../types';

export const generateAIRecipe = async (preferences: UserPreferences, apiKey: string): Promise<Recipe> => {
  const systemPrompt = `You are an expert AI Chef, Certified Nutritionist, and Fitness Coach. 

Generate a personalized healthy recipe based on the user's available ingredients, dietary goals, calorie target, and macronutrient requirements.

Instructions:
1. Analyze the user's nutritional requirements.
2. Create a delicious, realistic recipe using only the provided ingredients whenever possible.
3. Optimize the recipe to match the target calories, protein, carbs, and fats.
4. Suggest substitutions if essential ingredients are missing.
5. Ensure the recipe is healthy, balanced, and practical for home cooking.
6. Provide exact measurements for all ingredients.
7. Include preparation time, cooking time, and difficulty level.
8. Generate nutritional values per serving.
9. Explain why this recipe supports the user's fitness goal.
10. Create a visually appealing recipe title.
11. Generate a detailed AI image prompt for the recipe photo.

Respond ONLY with clean JSON in this EXACT format (no markdown, no extra text):
{
  "name": "Recipe Title",
  "description": "A short and appealing description of the recipe.",
  "category": "Healthy",
  "cuisine": "International",
  "prepTime": "15 mins",
  "cookTime": "20 mins",
  "servings": 4,
  "difficulty": "Easy",
  "nutrition": {
    "calories": 350,
    "protein": "25g",
    "carbs": "30g",
    "fat": "12g",
    "fiber": "5g"
  },
  "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1...", "Step 2..."],
  "fitnessBenefits": "Explain how the recipe helps achieve the user's goal.",
  "ingredientAlternatives": ["Alternative 1", "Alternative 2"],
  "imagePrompt": "Create an ultra-realistic food photography prompt describing the finished dish...",
  "scores": {
    "proteinScore": 8,
    "healthScore": 9,
    "goalCompatibilityScore": 10,
    "overallScore": 9
  }
}`;

  const userPrompt = `Available Ingredients: ${preferences.ingredients}
Goal: ${preferences.goal}
Daily Calorie Target: ${preferences.calories}
Target Protein: ${preferences.protein}g
Target Carbs: ${preferences.carbs}g
Target Fats: ${preferences.fats}g
Diet Preference: ${preferences.dietPreference}
Number of Servings: ${preferences.servings}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `Error: ${response.status}`);
  }

  const data = await response.json();
  let recipeJson;
  
  try {
    const content = data.choices[0].message.content.trim();
    // Try to extract JSON if there are extra characters
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      recipeJson = JSON.parse(jsonMatch[0]);
    } else {
      recipeJson = JSON.parse(content);
    }
  } catch (e) {
    throw new Error('Failed to parse AI response');
  }

  return {
    ...recipeJson,
    isGenerated: true,
  };
};

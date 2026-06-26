import axios from "axios";

const USDA = "https://api.nal.usda.gov/fdc/v1";

export async function getNutrition(ingredients, apiKey) {
  let total = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  for (const ing of ingredients) {
    try {
      const res = await axios.get(`${USDA}/foods/search`, {
        params: {
          api_key: apiKey,
          query: ing,
          pageSize: 1
        }
      });

      const food = res.data.foods?.[0];
      if (!food) continue;

      for (const n of food.foodNutrients || []) {
        const name = n.nutrientName?.toLowerCase();

        if (name.includes("energy")) total.calories += n.value;
        if (name.includes("protein")) total.protein += n.value;
        if (name.includes("carbohydrate")) total.carbs += n.value;
        if (name.includes("fat")) total.fat += n.value;
      }

    } catch (e) {
      continue;
    }
  }

  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat)
  };
}
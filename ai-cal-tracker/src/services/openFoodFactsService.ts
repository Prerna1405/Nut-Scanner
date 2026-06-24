export interface Product {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  sodium: number;
  imageUrl: string | null;
  barcode: string;
}

export async function searchByBarcode(barcode: string): Promise<Product | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          "User-Agent": "AICalTracker/1.0 (https://ai-cal-tracker.example.com)",
        },
      }
    );
    const data = await response.json();

    if (!data || data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    return {
      id: product.code || barcode,
      name: product.product_name || product.generic_name || "Unknown Product",
      brand: product.brands || null,
      servingSize: product.serving_size || null,
      calories: Math.round(nutriments["energy-kcal_100g"] || 0),
      protein: Math.round(nutriments["proteins_100g"] || 0),
      carbs: Math.round(nutriments["carbohydrates_100g"] || 0),
      fats: Math.round(nutriments["fat_100g"] || 0),
      fiber: Math.round(nutriments["fiber_100g"] || 0),
      sugars: Math.round(nutriments["sugars_100g"] || 0),
      sodium: Math.round(nutriments["sodium_100g"] || 0),
      imageUrl: product.image_url || product.image_front_url || null,
      barcode: barcode,
    };
  } catch (error) {
    console.error("OpenFoodFacts API error:", error);
    return null;
  }
}

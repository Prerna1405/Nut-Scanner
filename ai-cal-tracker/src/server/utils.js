export function normalizeIngredient(ing) {
  const map = {
    paneer: "cottage cheese",
    tomato: "tomatoes raw",
    onion: "onions raw",
    rice: "white rice cooked",
    potato: "potatoes raw",
    chicken: "chicken meat"
  };

  return map[ing.toLowerCase()] || ing;
}

export function makeCacheKey(arr) {
  return arr.sort().join("|").toLowerCase();
}
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { generateRecipe } from "./src/server/ai.js";
import { getNutrition } from "./src/server/nutrition.js";
import { normalizeIngredient, makeCacheKey } from "./src/server/utils.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// simple in-memory cache
const cache = new Map();

app.post("/recipe", async (req, res) => {
    try {
        let { ingredients } = req.body;

        if (!Array.isArray(ingredients)) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // normalize
        const normalized = ingredients.map(normalizeIngredient);

        // cache
        const key = makeCacheKey(normalized);
        if (cache.has(key)) {
            return res.json({
                success: true,
                cached: true,
                data: cache.get(key)
            });
        }

        // AI recipe
        const recipe = await generateRecipe(normalized);

        // nutrition
        const nutrition = await getNutrition(
            normalized,
            process.env.USDA_API_KEY
        );

        const result = {
            recipe,
            nutrition
        };

        cache.set(key, result);

        res.json({
            success: true,
            cached: false,
            data: result
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

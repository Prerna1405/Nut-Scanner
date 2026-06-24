import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function generateRecipe(ingredients) {
    const prompt = `
Return ONLY JSON.

Generate 1 realistic recipe using:
${ingredients.join(",")}

Format:
{
 "title":"",
 "ingredients":[{"name":"","quantity":""}],
 "steps":[],
 "cookTime":"",
 "servings":0
}
`;

    const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a strict JSON generator." },
            { role: "user", content: prompt }
        ]
    });

    return JSON.parse(res.choices[0].message.content);
}
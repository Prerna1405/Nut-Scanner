import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    foodName: { type: "STRING" },
    confidence: { type: "NUMBER" },
    portionSize: {
      type: "OBJECT",
      properties: {
        estimatedDimensions: { type: "STRING" },
        estimatedVolumeOrWeight: { type: "STRING" },
        visualReferenceCues: { type: "STRING" }
      },
      required: ["estimatedDimensions", "estimatedVolumeOrWeight", "visualReferenceCues"]
    },
    servingSize: {
      type: "OBJECT",
      properties: {
        label: { type: "STRING" },
        numberOfServingsInImage: { type: "NUMBER" }
      },
      required: ["label", "numberOfServingsInImage"]
    },
    nutritionFacts: {
      type: "OBJECT",
      properties: {
        calories: { type: "NUMBER" },
        carbs: { type: "NUMBER" },
        fats: { type: "NUMBER" },
        protein: { type: "NUMBER" },
        saturatedFat: { type: "NUMBER" },
        fiber: { type: "NUMBER" },
        sodium: { type: "NUMBER" },
        sugar: { type: "NUMBER" }
      },
      required: ["calories", "carbs", "fats", "protein", "saturatedFat", "fiber", "sodium", "sugar"]
    },
    ingredientsList: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    dietaryLabels: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    healthAssessment: { type: "STRING" }
  },
  required: [
    "foodName", "confidence", "portionSize", "servingSize", 
    "nutritionFacts", "ingredientsList", "dietaryLabels", "healthAssessment"
  ]
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Image, imageUrl } = body;

    if (!base64Image && !imageUrl) {
      return Response.json({ error: 'Missing image data' }, { status: 400 });
    }

    let inlineData = null;

    if (base64Image) {
      // Remove data URI prefix if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      let mimeType = 'image/jpeg';
      const match = base64Image.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
      }
      
      inlineData = {
        data: base64Data,
        mimeType: mimeType
      };
    } else if (imageUrl) {
      // Fetch the image to get base64
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      inlineData = {
        data: base64Data,
        mimeType: mimeType
      };
    }

    const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    const prompt = "Analyze this food image in extreme detail. Identify the food, estimate the portion size using visual cues, calculate the exact nutrition facts for the visible portion, list ingredients, dietary labels, and provide a short health assessment.";

    let lastError = null;

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            prompt,
            { inlineData }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA
          }
        });

        if (!response.text) {
          throw new Error("Empty response text");
        }

        const parsedData = JSON.parse(response.text);
        return Response.json({ data: parsedData });
        
      } catch (error: any) {
        console.warn(`[Scan Food API] Model ${model} failed:`, error?.message);
        lastError = error;
        // Wait 1 second before falling back
        if (i < models.length - 1) {
          await sleep(1000);
        }
      }
    }

    return Response.json({ error: 'All models failed', details: lastError?.message }, { status: 500 });

  } catch (error: any) {
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

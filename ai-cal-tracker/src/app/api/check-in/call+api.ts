import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, history = [], shortfall, calories, target, message } = body;

    const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

    if (action === "chat") {
      const systemInstruction = `You are a supportive, empathetic AI Health Coach. The user's goal is to eat ${target} calories today, but they have only eaten ${calories} calories (a shortfall of ${shortfall} kcal). Your goal is to ask them why they fell short today in a friendly, conversational manner. Offer brief, practical advice. Keep your responses short, conversational, and spoken-style (1-2 sentences max), as they will be read aloud via Text-to-Speech.`;
      
      const contents = [
        ...history,
        { role: "user", parts: [{ text: message }] }
      ];

      let lastError = null;
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        try {
          const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
            }
          });
          return Response.json({ response: response.text });
        } catch (e: any) {
          console.warn(`[Coach API] Model ${model} failed`, e?.message);
          lastError = e;
          if (i < models.length - 1) await sleep(1000);
        }
      }
      return Response.json({ error: "All models failed", details: lastError?.message }, { status: 500 });

    } else if (action === "summarize") {
      const prompt = `Summarize this health coaching session in a short paragraph. Extract: 1) Why the user missed their calorie target. 2) The main advice given. \n\nTranscript:\n${history.map((m: any) => `${m.role}: ${m.parts[0].text}`).join("\n")}`;
      
      let lastError = null;
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        try {
          const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });
          return Response.json({ summary: response.text });
        } catch (e: any) {
          console.warn(`[Coach API] Model ${model} failed`, e?.message);
          lastError = e;
          if (i < models.length - 1) await sleep(1000);
        }
      }
      return Response.json({ error: "All models failed", details: lastError?.message }, { status: 500 });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

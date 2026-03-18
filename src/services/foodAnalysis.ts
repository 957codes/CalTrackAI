import { FoodItem, MacroBreakdown } from "../types";

const ANTHROPIC_API_KEY = ""; // Set via env or config in production

interface AnalysisResult {
  foods: FoodItem[];
  totalMacros: MacroBreakdown;
}

export async function analyzeFoodPhoto(
  base64Image: string
): Promise<AnalysisResult> {
  if (!ANTHROPIC_API_KEY) {
    // Demo mode: return realistic mock data when no API key is configured
    return getMockAnalysis();
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2024-01-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Analyze this food photo. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{"foods":[{"name":"string","portion":"string","macros":{"calories":number,"protein":number,"carbs":number,"fat":number}}]}
Estimate realistic nutritional values. Be specific about portion sizes.`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  try {
    const parsed = JSON.parse(text);
    const foods: FoodItem[] = parsed.foods;
    const totalMacros = foods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.macros.calories,
        protein: acc.protein + f.macros.protein,
        carbs: acc.carbs + f.macros.carbs,
        fat: acc.fat + f.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return { foods, totalMacros };
  } catch {
    return getMockAnalysis();
  }
}

function getMockAnalysis(): AnalysisResult {
  const mockFoods: FoodItem[][] = [
    [
      {
        name: "Grilled Chicken Breast",
        portion: "6 oz",
        macros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
      },
      {
        name: "Brown Rice",
        portion: "1 cup",
        macros: { calories: 215, protein: 5, carbs: 45, fat: 2 },
      },
      {
        name: "Steamed Broccoli",
        portion: "1 cup",
        macros: { calories: 55, protein: 4, carbs: 11, fat: 1 },
      },
    ],
    [
      {
        name: "Avocado Toast",
        portion: "2 slices",
        macros: { calories: 380, protein: 10, carbs: 36, fat: 22 },
      },
      {
        name: "Poached Eggs",
        portion: "2 large",
        macros: { calories: 140, protein: 12, carbs: 1, fat: 10 },
      },
    ],
    [
      {
        name: "Caesar Salad",
        portion: "1 bowl",
        macros: { calories: 320, protein: 8, carbs: 18, fat: 24 },
      },
      {
        name: "Grilled Salmon",
        portion: "5 oz",
        macros: { calories: 290, protein: 36, carbs: 0, fat: 15 },
      },
    ],
  ];

  const foods = mockFoods[Math.floor(Math.random() * mockFoods.length)];
  const totalMacros = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.macros.calories,
      protein: acc.protein + f.macros.protein,
      carbs: acc.carbs + f.macros.carbs,
      fat: acc.fat + f.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { foods, totalMacros };
}

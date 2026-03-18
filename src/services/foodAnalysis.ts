import { FoodItem, MacroBreakdown } from "../types";
import { Sentry, trackUserAction } from "./sentry";

const ANTHROPIC_API_KEY = ""; // Set via env or config in production

export interface AnalysisResult {
  foods: FoodItem[];
  totalMacros: MacroBreakdown;
  overallConfidence: number;
}

const FOOD_ANALYSIS_PROMPT = `You are a nutrition analysis AI. Analyze this food photo carefully.

INSTRUCTIONS:
1. Identify ALL visible food items, including sauces, dressings, oils, and condiments — these are often the biggest hidden calorie sources.
2. For portion estimation, look for reference objects (fork, hand, plate size, cup) to gauge scale. If no reference object is visible, estimate conservatively and note lower confidence.
3. For mixed dishes (stir-fry, casseroles, bowls), break them down into their visible components rather than treating them as one item.
4. Assign a confidence score (0-100) for each item based on how clearly you can identify and estimate it.
5. Categorize each item: "main", "side", "sauce", "dressing", "oil", "beverage", or "condiment".

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{"foods":[{"name":"string","portion":"string (e.g. '6 oz', '1 cup', '2 tbsp')","category":"main|side|sauce|dressing|oil|beverage|condiment","confidence":number,"macros":{"calories":number,"protein":number,"carbs":number,"fat":number}}]}

RULES:
- Be specific about portion sizes using common measurements (oz, cups, tbsp, pieces).
- Always list sauces/dressings/oils separately from the base food.
- For fried foods, account for absorbed oil in the fat estimate.
- Round calories to nearest 5, macros to nearest 1g.
- Confidence should be 90+ only if the food is clearly identifiable and portion is obvious.
- Confidence should be below 70 if the food is partially obscured, ambiguous, or portion is hard to gauge.`;

export async function analyzeFoodPhoto(
  base64Image: string
): Promise<AnalysisResult> {
  if (!ANTHROPIC_API_KEY) {
    trackUserAction("ai_analysis_start", { mode: "mock" });
    return getMockAnalysis();
  }

  trackUserAction("ai_analysis_start", { mode: "live" });

  try {
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
                text: FOOD_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      Sentry.captureMessage("AI analysis API error", {
        level: "error",
        extra: { status: response.status, body: errorText },
      });
      trackUserAction("ai_analysis_error", { status: String(response.status) });
      return getMockAnalysis();
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    try {
      const parsed = JSON.parse(text);
      const result = buildResult(parsed.foods);
      trackUserAction("ai_analysis_success", {
        itemCount: String(result.foods.length),
        totalCalories: String(result.totalMacros.calories),
      });
      return result;
    } catch {
      Sentry.captureMessage("AI analysis JSON parse failed", {
        level: "warning",
        extra: { rawResponse: text.slice(0, 500) },
      });
      trackUserAction("ai_analysis_parse_error");
      return getMockAnalysis();
    }
  } catch (error) {
    Sentry.captureException(error);
    trackUserAction("ai_analysis_network_error");
    return getMockAnalysis();
  }
}

function buildResult(
  rawFoods: Array<{
    name: string;
    portion: string;
    category?: string;
    confidence?: number;
    macros: MacroBreakdown;
  }>
): AnalysisResult {
  const foods: FoodItem[] = rawFoods.map((f) => ({
    name: f.name,
    portion: f.portion,
    macros: {
      calories: Math.round(f.macros.calories / 5) * 5,
      protein: Math.round(f.macros.protein),
      carbs: Math.round(f.macros.carbs),
      fat: Math.round(f.macros.fat),
    },
    confidence: typeof f.confidence === "number" ? f.confidence : 75,
    category: validCategory(f.category) || "main",
  }));

  const totalMacros = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.macros.calories,
      protein: acc.protein + f.macros.protein,
      carbs: acc.carbs + f.macros.carbs,
      fat: acc.fat + f.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const overallConfidence =
    foods.length > 0
      ? Math.round(foods.reduce((sum, f) => sum + f.confidence, 0) / foods.length)
      : 0;

  return { foods, totalMacros, overallConfidence };
}

function validCategory(
  cat?: string
): FoodItem["category"] | undefined {
  const valid = ["main", "side", "sauce", "dressing", "oil", "beverage", "condiment"];
  return valid.includes(cat || "") ? (cat as FoodItem["category"]) : undefined;
}

function getMockAnalysis(): AnalysisResult {
  const mockFoods: FoodItem[][] = [
    [
      {
        name: "Grilled Chicken Breast",
        portion: "6 oz",
        macros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
        confidence: 92,
        category: "main",
      },
      {
        name: "Brown Rice",
        portion: "1 cup",
        macros: { calories: 215, protein: 5, carbs: 45, fat: 2 },
        confidence: 85,
        category: "side",
      },
      {
        name: "Steamed Broccoli",
        portion: "1 cup",
        macros: { calories: 55, protein: 4, carbs: 11, fat: 1 },
        confidence: 90,
        category: "side",
      },
      {
        name: "Soy Sauce",
        portion: "1 tbsp",
        macros: { calories: 10, protein: 1, carbs: 1, fat: 0 },
        confidence: 65,
        category: "sauce",
      },
    ],
    [
      {
        name: "Avocado Toast",
        portion: "2 slices",
        macros: { calories: 380, protein: 10, carbs: 36, fat: 22 },
        confidence: 88,
        category: "main",
      },
      {
        name: "Poached Eggs",
        portion: "2 large",
        macros: { calories: 140, protein: 12, carbs: 1, fat: 10 },
        confidence: 90,
        category: "main",
      },
      {
        name: "Olive Oil Drizzle",
        portion: "1 tbsp",
        macros: { calories: 120, protein: 0, carbs: 0, fat: 14 },
        confidence: 55,
        category: "oil",
      },
    ],
    [
      {
        name: "Romaine Lettuce",
        portion: "2 cups",
        macros: { calories: 15, protein: 1, carbs: 3, fat: 0 },
        confidence: 95,
        category: "main",
      },
      {
        name: "Grilled Salmon",
        portion: "5 oz",
        macros: { calories: 290, protein: 36, carbs: 0, fat: 15 },
        confidence: 88,
        category: "main",
      },
      {
        name: "Caesar Dressing",
        portion: "2 tbsp",
        macros: { calories: 150, protein: 1, carbs: 1, fat: 16 },
        confidence: 60,
        category: "dressing",
      },
      {
        name: "Parmesan Cheese",
        portion: "1 tbsp",
        macros: { calories: 22, protein: 2, carbs: 0, fat: 1 },
        confidence: 70,
        category: "condiment",
      },
      {
        name: "Croutons",
        portion: "1/4 cup",
        macros: { calories: 30, protein: 1, carbs: 6, fat: 1 },
        confidence: 80,
        category: "side",
      },
    ],
  ];

  const foods = mockFoods[Math.floor(Math.random() * mockFoods.length)];
  return buildResult(foods);
}

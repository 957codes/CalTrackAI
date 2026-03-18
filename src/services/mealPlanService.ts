import {
  WeeklyMealPlan,
  DayPlan,
  PlannedMeal,
  MacroBreakdown,
  DietaryPreference,
  GroceryItem,
  FoodItem,
} from "../types";
import { Sentry, trackUserAction } from "./sentry";

const ANTHROPIC_API_KEY = ""; // Set via env or config in production

const MEAL_PLAN_PROMPT = `You are a nutrition planning AI. Generate a 7-day meal plan.

INPUTS:
- Daily calorie target: {calories} kcal
- Protein target: {protein}g
- Carbs target: {carbs}g
- Fat target: {fat}g
- Dietary preference: {preference}

INSTRUCTIONS:
1. Create meals for each day: breakfast, lunch, dinner, and one snack.
2. Each day should hit within 5% of the calorie target and be reasonably close on macros.
3. Vary meals across the week — avoid repeating the same meal more than twice.
4. Use common, accessible ingredients. Prefer whole foods.
5. For each meal, list individual food items with portions and macros.

Return ONLY valid JSON (no markdown, no code fences) with this structure:
{"days":[{"meals":[{"name":"Meal name","mealType":"breakfast|lunch|dinner|snack","foods":[{"name":"string","portion":"string","macros":{"calories":number,"protein":number,"carbs":number,"fat":number}}]}]}]}

RULES:
- Round calories to nearest 5, macros to nearest 1g.
- Keep meals practical — 15-30 min prep time.
- Respect dietary preference strictly (vegetarian = no meat/fish, vegan = no animal products, keto = under 30g carbs/day).`;

function buildPrompt(
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  preference: DietaryPreference
): string {
  return MEAL_PLAN_PROMPT.replace("{calories}", String(calories))
    .replace("{protein}", String(protein))
    .replace("{carbs}", String(carbs))
    .replace("{fat}", String(fat))
    .replace("{preference}", preference === "none" ? "no restrictions" : preference);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  // Start from next Monday
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function sumFoodMacros(foods: FoodItem[]): MacroBreakdown {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.macros.calories,
      protein: acc.protein + f.macros.protein,
      carbs: acc.carbs + f.macros.carbs,
      fat: acc.fat + f.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function sumMealMacros(meals: PlannedMeal[]): MacroBreakdown {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalMacros.calories,
      protein: acc.protein + m.totalMacros.protein,
      carbs: acc.carbs + m.totalMacros.carbs,
      fat: acc.fat + m.totalMacros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function parseMealPlanResponse(
  raw: { days: Array<{ meals: Array<{ name: string; mealType: string; foods: Array<{ name: string; portion: string; macros: MacroBreakdown }> }> }> },
  dates: string[]
): DayPlan[] {
  return raw.days.map((day, i) => {
    const meals: PlannedMeal[] = day.meals.map((m) => {
      const foods: FoodItem[] = m.foods.map((f) => ({
        name: f.name,
        portion: f.portion,
        macros: {
          calories: Math.round(f.macros.calories / 5) * 5,
          protein: Math.round(f.macros.protein),
          carbs: Math.round(f.macros.carbs),
          fat: Math.round(f.macros.fat),
        },
        confidence: 95,
      }));
      const mealType = (["breakfast", "lunch", "dinner", "snack"].includes(m.mealType)
        ? m.mealType
        : "snack") as PlannedMeal["mealType"];
      return {
        id: generateId(),
        name: m.name,
        mealType,
        foods,
        totalMacros: sumFoodMacros(foods),
      };
    });
    return {
      date: dates[i] || dates[0],
      meals,
      totalMacros: sumMealMacros(meals),
    };
  });
}

export async function generateMealPlan(
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  dietaryPreference: DietaryPreference
): Promise<WeeklyMealPlan> {
  const dates = getWeekDates();

  if (!ANTHROPIC_API_KEY) {
    trackUserAction("meal_plan_generate", { mode: "mock" });
    return buildMockPlan(targetCalories, targetProtein, targetCarbs, targetFat, dietaryPreference, dates);
  }

  trackUserAction("meal_plan_generate", { mode: "live" });

  try {
    const prompt = buildPrompt(targetCalories, targetProtein, targetCarbs, targetFat, dietaryPreference);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2024-01-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      Sentry.captureMessage("Meal plan API error", {
        level: "error",
        extra: { status: response.status },
      });
      trackUserAction("meal_plan_api_error", { status: String(response.status) });
      return buildMockPlan(targetCalories, targetProtein, targetCarbs, targetFat, dietaryPreference, dates);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    try {
      const parsed = JSON.parse(text);
      const days = parseMealPlanResponse(parsed, dates);
      trackUserAction("meal_plan_success", { days: String(days.length) });
      return {
        id: generateId(),
        name: `Week of ${formatDate(dates[0])}`,
        createdAt: Date.now(),
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        dietaryPreference,
        days,
        isFavorite: false,
      };
    } catch {
      Sentry.captureMessage("Meal plan JSON parse failed", { level: "warning" });
      trackUserAction("meal_plan_parse_error");
      return buildMockPlan(targetCalories, targetProtein, targetCarbs, targetFat, dietaryPreference, dates);
    }
  } catch (error) {
    Sentry.captureException(error);
    trackUserAction("meal_plan_network_error");
    return buildMockPlan(targetCalories, targetProtein, targetCarbs, targetFat, dietaryPreference, dates);
  }
}

export function generateGroceryList(plan: WeeklyMealPlan): GroceryItem[] {
  const ingredientMap = new Map<string, { quantity: number; unit: string; category: string }>();

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const food of meal.foods) {
        const key = food.name.toLowerCase();
        const existing = ingredientMap.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          const category = categorizeIngredient(food.name);
          ingredientMap.set(key, { quantity: 1, unit: food.portion, category });
        }
      }
    }
  }

  return Array.from(ingredientMap.entries())
    .map(([name, info]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: info.quantity > 1 ? `${info.quantity}x ${info.unit}` : info.unit,
      category: info.category,
      checked: false,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  if (/chicken|beef|pork|turkey|salmon|fish|shrimp|tofu|tempeh/.test(lower)) return "Protein";
  if (/milk|cheese|yogurt|cream|butter/.test(lower)) return "Dairy";
  if (/rice|bread|pasta|oat|tortilla|quinoa/.test(lower)) return "Grains";
  if (/apple|banana|berry|orange|fruit|avocado/.test(lower)) return "Fruits";
  if (/lettuce|broccoli|spinach|tomato|onion|pepper|carrot|potato|vegetable|kale|cucumber/.test(lower)) return "Vegetables";
  if (/oil|olive|vinegar|sauce|dressing|mustard|honey/.test(lower)) return "Condiments";
  if (/almond|walnut|peanut|cashew|seed|nut/.test(lower)) return "Nuts & Seeds";
  return "Other";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Mock plan for development / when API key is not set
function buildMockPlan(
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  dietaryPreference: DietaryPreference,
  dates: string[]
): WeeklyMealPlan {
  const mockDays: DayPlan[] = dates.map((date, dayIdx) => {
    const breakfasts = [
      { name: "Greek Yogurt Parfait", foods: [
        { name: "Greek Yogurt", portion: "1 cup", macros: { calories: 130, protein: 20, carbs: 8, fat: 0 }, confidence: 95 },
        { name: "Mixed Berries", portion: "1/2 cup", macros: { calories: 40, protein: 1, carbs: 10, fat: 0 }, confidence: 90 },
        { name: "Granola", portion: "1/4 cup", macros: { calories: 120, protein: 3, carbs: 20, fat: 4 }, confidence: 85 },
      ]},
      { name: "Scrambled Eggs & Toast", foods: [
        { name: "Eggs", portion: "3 large", macros: { calories: 210, protein: 18, carbs: 2, fat: 15 }, confidence: 95 },
        { name: "Whole Wheat Toast", portion: "2 slices", macros: { calories: 160, protein: 6, carbs: 28, fat: 2 }, confidence: 90 },
        { name: "Butter", portion: "1 tbsp", macros: { calories: 100, protein: 0, carbs: 0, fat: 11 }, confidence: 90 },
      ]},
      { name: "Oatmeal with Banana", foods: [
        { name: "Rolled Oats", portion: "1 cup", macros: { calories: 300, protein: 10, carbs: 54, fat: 5 }, confidence: 95 },
        { name: "Banana", portion: "1 medium", macros: { calories: 105, protein: 1, carbs: 27, fat: 0 }, confidence: 95 },
        { name: "Almond Butter", portion: "1 tbsp", macros: { calories: 100, protein: 3, carbs: 3, fat: 9 }, confidence: 90 },
      ]},
    ];

    const lunches = [
      { name: "Chicken Caesar Salad", foods: [
        { name: "Grilled Chicken Breast", portion: "5 oz", macros: { calories: 230, protein: 43, carbs: 0, fat: 5 }, confidence: 92 },
        { name: "Romaine Lettuce", portion: "2 cups", macros: { calories: 15, protein: 1, carbs: 3, fat: 0 }, confidence: 95 },
        { name: "Caesar Dressing", portion: "2 tbsp", macros: { calories: 150, protein: 1, carbs: 1, fat: 16 }, confidence: 80 },
        { name: "Parmesan Cheese", portion: "2 tbsp", macros: { calories: 45, protein: 4, carbs: 0, fat: 3 }, confidence: 85 },
      ]},
      { name: "Turkey Wrap", foods: [
        { name: "Turkey Breast", portion: "4 oz", macros: { calories: 120, protein: 26, carbs: 0, fat: 1 }, confidence: 90 },
        { name: "Whole Wheat Tortilla", portion: "1 large", macros: { calories: 210, protein: 6, carbs: 36, fat: 5 }, confidence: 90 },
        { name: "Mixed Greens", portion: "1 cup", macros: { calories: 10, protein: 1, carbs: 2, fat: 0 }, confidence: 95 },
        { name: "Hummus", portion: "2 tbsp", macros: { calories: 70, protein: 2, carbs: 6, fat: 4 }, confidence: 85 },
      ]},
      { name: "Quinoa Bowl", foods: [
        { name: "Quinoa", portion: "1 cup", macros: { calories: 220, protein: 8, carbs: 39, fat: 4 }, confidence: 95 },
        { name: "Black Beans", portion: "1/2 cup", macros: { calories: 115, protein: 8, carbs: 20, fat: 0 }, confidence: 90 },
        { name: "Avocado", portion: "1/2", macros: { calories: 120, protein: 1, carbs: 6, fat: 11 }, confidence: 90 },
        { name: "Cherry Tomatoes", portion: "1/2 cup", macros: { calories: 15, protein: 1, carbs: 3, fat: 0 }, confidence: 90 },
      ]},
    ];

    const dinners = [
      { name: "Salmon with Brown Rice", foods: [
        { name: "Grilled Salmon", portion: "6 oz", macros: { calories: 350, protein: 40, carbs: 0, fat: 20 }, confidence: 90 },
        { name: "Brown Rice", portion: "1 cup", macros: { calories: 215, protein: 5, carbs: 45, fat: 2 }, confidence: 95 },
        { name: "Steamed Broccoli", portion: "1 cup", macros: { calories: 55, protein: 4, carbs: 11, fat: 1 }, confidence: 92 },
      ]},
      { name: "Chicken Stir-Fry", foods: [
        { name: "Chicken Breast", portion: "5 oz", macros: { calories: 230, protein: 43, carbs: 0, fat: 5 }, confidence: 90 },
        { name: "Mixed Vegetables", portion: "2 cups", macros: { calories: 80, protein: 4, carbs: 16, fat: 0 }, confidence: 85 },
        { name: "Jasmine Rice", portion: "1 cup", macros: { calories: 205, protein: 4, carbs: 45, fat: 0 }, confidence: 95 },
        { name: "Soy Sauce", portion: "1 tbsp", macros: { calories: 10, protein: 1, carbs: 1, fat: 0 }, confidence: 80 },
      ]},
      { name: "Turkey Meatballs & Pasta", foods: [
        { name: "Turkey Meatballs", portion: "5 oz", macros: { calories: 250, protein: 30, carbs: 5, fat: 12 }, confidence: 85 },
        { name: "Whole Wheat Pasta", portion: "1.5 cups", macros: { calories: 260, protein: 10, carbs: 50, fat: 2 }, confidence: 90 },
        { name: "Marinara Sauce", portion: "1/2 cup", macros: { calories: 70, protein: 2, carbs: 10, fat: 2 }, confidence: 85 },
      ]},
    ];

    const snacks = [
      { name: "Apple & Almond Butter", foods: [
        { name: "Apple", portion: "1 medium", macros: { calories: 95, protein: 0, carbs: 25, fat: 0 }, confidence: 95 },
        { name: "Almond Butter", portion: "2 tbsp", macros: { calories: 200, protein: 7, carbs: 6, fat: 18 }, confidence: 90 },
      ]},
      { name: "Protein Shake", foods: [
        { name: "Whey Protein", portion: "1 scoop", macros: { calories: 120, protein: 24, carbs: 3, fat: 1 }, confidence: 95 },
        { name: "Banana", portion: "1 medium", macros: { calories: 105, protein: 1, carbs: 27, fat: 0 }, confidence: 95 },
      ]},
      { name: "Trail Mix", foods: [
        { name: "Mixed Nuts", portion: "1/4 cup", macros: { calories: 170, protein: 5, carbs: 7, fat: 15 }, confidence: 90 },
        { name: "Dried Cranberries", portion: "2 tbsp", macros: { calories: 45, protein: 0, carbs: 12, fat: 0 }, confidence: 90 },
      ]},
    ];

    const bi = dayIdx % breakfasts.length;
    const li = dayIdx % lunches.length;
    const di = dayIdx % dinners.length;
    const si = dayIdx % snacks.length;

    const makeMeal = (data: { name: string; foods: Omit<FoodItem, "confidence">[] }, mealType: PlannedMeal["mealType"]): PlannedMeal => {
      const foods: FoodItem[] = data.foods.map((f) => ({ ...f, confidence: (f as FoodItem).confidence ?? 90 }));
      return {
        id: generateId(),
        name: data.name,
        mealType,
        foods,
        totalMacros: sumFoodMacros(foods),
      };
    };

    const meals = [
      makeMeal(breakfasts[bi], "breakfast"),
      makeMeal(lunches[li], "lunch"),
      makeMeal(dinners[di], "dinner"),
      makeMeal(snacks[si], "snack"),
    ];

    return {
      date,
      meals,
      totalMacros: sumMealMacros(meals),
    };
  });

  return {
    id: generateId(),
    name: `Week of ${formatDate(dates[0])}`,
    createdAt: Date.now(),
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    dietaryPreference,
    days: mockDays,
    isFavorite: false,
  };
}

export async function generateSwapSuggestion(
  currentMeal: PlannedMeal,
  targetCalories: number,
  dietaryPreference: DietaryPreference
): Promise<PlannedMeal> {
  // In mock mode, just rotate through mock meals
  trackUserAction("meal_swap", { mealType: currentMeal.mealType });

  const swaps: Record<string, Array<{ name: string; foods: FoodItem[] }>> = {
    breakfast: [
      { name: "Smoothie Bowl", foods: [
        { name: "Mixed Berries", portion: "1 cup", macros: { calories: 85, protein: 1, carbs: 20, fat: 1 }, confidence: 90 },
        { name: "Banana", portion: "1 medium", macros: { calories: 105, protein: 1, carbs: 27, fat: 0 }, confidence: 95 },
        { name: "Protein Powder", portion: "1 scoop", macros: { calories: 120, protein: 24, carbs: 3, fat: 1 }, confidence: 90 },
        { name: "Chia Seeds", portion: "1 tbsp", macros: { calories: 60, protein: 2, carbs: 5, fat: 4 }, confidence: 90 },
      ]},
    ],
    lunch: [
      { name: "Mediterranean Bowl", foods: [
        { name: "Falafel", portion: "4 pieces", macros: { calories: 230, protein: 10, carbs: 26, fat: 10 }, confidence: 85 },
        { name: "Brown Rice", portion: "3/4 cup", macros: { calories: 160, protein: 4, carbs: 34, fat: 1 }, confidence: 90 },
        { name: "Cucumber Salad", portion: "1 cup", macros: { calories: 30, protein: 1, carbs: 6, fat: 0 }, confidence: 90 },
        { name: "Tahini Dressing", portion: "2 tbsp", macros: { calories: 90, protein: 3, carbs: 3, fat: 8 }, confidence: 85 },
      ]},
    ],
    dinner: [
      { name: "Grilled Shrimp & Veggies", foods: [
        { name: "Grilled Shrimp", portion: "6 oz", macros: { calories: 180, protein: 36, carbs: 1, fat: 2 }, confidence: 90 },
        { name: "Roasted Sweet Potato", portion: "1 medium", macros: { calories: 115, protein: 2, carbs: 27, fat: 0 }, confidence: 90 },
        { name: "Asparagus", portion: "1 cup", macros: { calories: 40, protein: 4, carbs: 7, fat: 0 }, confidence: 90 },
        { name: "Olive Oil", portion: "1 tbsp", macros: { calories: 120, protein: 0, carbs: 0, fat: 14 }, confidence: 90 },
      ]},
    ],
    snack: [
      { name: "Greek Yogurt & Honey", foods: [
        { name: "Greek Yogurt", portion: "3/4 cup", macros: { calories: 100, protein: 15, carbs: 6, fat: 0 }, confidence: 95 },
        { name: "Honey", portion: "1 tbsp", macros: { calories: 65, protein: 0, carbs: 17, fat: 0 }, confidence: 95 },
        { name: "Walnuts", portion: "1 tbsp", macros: { calories: 50, protein: 1, carbs: 1, fat: 5 }, confidence: 90 },
      ]},
    ],
  };

  const options = swaps[currentMeal.mealType] || swaps.snack;
  const chosen = options[0];
  const foods: FoodItem[] = chosen.foods;

  return {
    id: generateId(),
    name: chosen.name,
    mealType: currentMeal.mealType,
    foods,
    totalMacros: sumFoodMacros(foods),
  };
}

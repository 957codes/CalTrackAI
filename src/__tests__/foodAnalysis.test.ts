import { analyzeFoodPhoto } from "../services/foodAnalysis";

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("analyzeFoodPhoto", () => {
  it("returns mock analysis when no API key is set", async () => {
    // The ANTHROPIC_API_KEY is empty string in source, so it should return mock data
    const result = await analyzeFoodPhoto("base64data");
    expect(result.foods.length).toBeGreaterThan(0);
    expect(result.totalMacros.calories).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeGreaterThan(0);
  });

  it("mock analysis has valid food items with all required fields", async () => {
    const result = await analyzeFoodPhoto("base64data");
    for (const food of result.foods) {
      expect(food.name).toBeTruthy();
      expect(food.portion).toBeTruthy();
      expect(food.macros).toBeDefined();
      expect(food.macros.calories).toBeGreaterThanOrEqual(0);
      expect(food.macros.protein).toBeGreaterThanOrEqual(0);
      expect(food.macros.carbs).toBeGreaterThanOrEqual(0);
      expect(food.macros.fat).toBeGreaterThanOrEqual(0);
      expect(food.confidence).toBeGreaterThan(0);
      expect(food.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("mock analysis totals match sum of individual foods", async () => {
    const result = await analyzeFoodPhoto("base64data");
    const sumCalories = result.foods.reduce((s, f) => s + f.macros.calories, 0);
    const sumProtein = result.foods.reduce((s, f) => s + f.macros.protein, 0);
    expect(result.totalMacros.calories).toBe(sumCalories);
    expect(result.totalMacros.protein).toBe(sumProtein);
  });

  it("calories are rounded to nearest 5", async () => {
    const result = await analyzeFoodPhoto("base64data");
    for (const food of result.foods) {
      expect(food.macros.calories % 5).toBe(0);
    }
  });

  it("overall confidence is average of food confidences", async () => {
    const result = await analyzeFoodPhoto("base64data");
    const avgConfidence = Math.round(
      result.foods.reduce((s, f) => s + f.confidence, 0) / result.foods.length
    );
    expect(result.overallConfidence).toBe(avgConfidence);
  });

  it("each food has a valid category", async () => {
    const validCategories = ["main", "side", "sauce", "dressing", "oil", "beverage", "condiment"];
    const result = await analyzeFoodPhoto("base64data");
    for (const food of result.foods) {
      if (food.category) {
        expect(validCategories).toContain(food.category);
      }
    }
  });
});

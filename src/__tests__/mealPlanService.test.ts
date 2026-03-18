import { generateMealPlan, generateGroceryList, generateSwapSuggestion } from "../services/mealPlanService";
import { WeeklyMealPlan } from "../types";

describe("generateMealPlan (mock mode)", () => {
  it("generates a 7-day plan with correct structure", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    expect(plan.days).toHaveLength(7);
    expect(plan.targetCalories).toBe(2000);
    expect(plan.targetProtein).toBe(150);
    expect(plan.dietaryPreference).toBe("none");
    expect(plan.isFavorite).toBe(false);
    expect(plan.id).toBeTruthy();
    expect(plan.name).toBeTruthy();
  });

  it("each day has 4 meals (breakfast, lunch, dinner, snack)", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    for (const day of plan.days) {
      expect(day.meals).toHaveLength(4);
      const types = day.meals.map((m) => m.mealType);
      expect(types).toContain("breakfast");
      expect(types).toContain("lunch");
      expect(types).toContain("dinner");
      expect(types).toContain("snack");
    }
  });

  it("each meal has foods with macros", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    for (const day of plan.days) {
      for (const meal of day.meals) {
        expect(meal.foods.length).toBeGreaterThan(0);
        expect(meal.totalMacros.calories).toBeGreaterThan(0);
        expect(meal.name).toBeTruthy();
        expect(meal.id).toBeTruthy();
        for (const food of meal.foods) {
          expect(food.name).toBeTruthy();
          expect(food.portion).toBeTruthy();
          expect(food.macros.calories).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("day totalMacros equals sum of meal macros", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    for (const day of plan.days) {
      const sumCals = day.meals.reduce((s, m) => s + m.totalMacros.calories, 0);
      expect(day.totalMacros.calories).toBe(sumCals);
    }
  });

  it("days have valid date strings", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    for (const day of plan.days) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("generateGroceryList", () => {
  it("generates grocery items from a plan", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    const groceries = generateGroceryList(plan);
    expect(groceries.length).toBeGreaterThan(0);
    for (const item of groceries) {
      expect(item.name).toBeTruthy();
      expect(item.quantity).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.checked).toBe(false);
    }
  });

  it("groups duplicate ingredients", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    const groceries = generateGroceryList(plan);
    const names = groceries.map((g) => g.name.toLowerCase());
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });

  it("items are sorted by category", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    const groceries = generateGroceryList(plan);
    for (let i = 1; i < groceries.length; i++) {
      const cmp = groceries[i].category.localeCompare(groceries[i - 1].category);
      expect(cmp).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("generateSwapSuggestion", () => {
  it("returns a meal with the same mealType", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    const breakfast = plan.days[0].meals.find((m) => m.mealType === "breakfast")!;
    const swapped = await generateSwapSuggestion(breakfast, 2000, "none");
    expect(swapped.mealType).toBe("breakfast");
    expect(swapped.id).toBeTruthy();
    expect(swapped.name).toBeTruthy();
    expect(swapped.foods.length).toBeGreaterThan(0);
    expect(swapped.totalMacros.calories).toBeGreaterThan(0);
  });

  it("returns a different meal than the original", async () => {
    const plan = await generateMealPlan(2000, 150, 250, 65, "none");
    const lunch = plan.days[0].meals.find((m) => m.mealType === "lunch")!;
    const swapped = await generateSwapSuggestion(lunch, 2000, "none");
    expect(swapped.name).not.toBe(lunch.name);
  });
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveMealPlan,
  getAllMealPlans,
  getMealPlan,
  deleteMealPlan,
  setActivePlan,
  getActivePlan,
  toggleFavorite,
  swapMeal,
  saveGroceryList,
  getGroceryList,
} from "../utils/mealPlanStorage";
import { WeeklyMealPlan, PlannedMeal, GroceryItem } from "../types";

function makePlan(overrides: Partial<WeeklyMealPlan> = {}): WeeklyMealPlan {
  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "Test Plan",
    createdAt: Date.now(),
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFat: 65,
    dietaryPreference: "none",
    days: [
      {
        date: "2026-03-23",
        meals: [
          {
            id: "meal-1",
            name: "Test Breakfast",
            mealType: "breakfast",
            foods: [
              {
                name: "Oats",
                portion: "1 cup",
                macros: { calories: 300, protein: 10, carbs: 54, fat: 5 },
                confidence: 95,
              },
            ],
            totalMacros: { calories: 300, protein: 10, carbs: 54, fat: 5 },
          },
          {
            id: "meal-2",
            name: "Test Lunch",
            mealType: "lunch",
            foods: [
              {
                name: "Chicken",
                portion: "6 oz",
                macros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
                confidence: 90,
              },
            ],
            totalMacros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
          },
        ],
        totalMacros: { calories: 580, protein: 63, carbs: 54, fat: 11 },
      },
    ],
    isFavorite: false,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("saveMealPlan / getAllMealPlans", () => {
  it("saves and retrieves a meal plan", async () => {
    const plan = makePlan({ id: "p1" });
    await saveMealPlan(plan);
    const plans = await getAllMealPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe("p1");
  });

  it("updates existing plan by id", async () => {
    const plan = makePlan({ id: "p1", name: "Original" });
    await saveMealPlan(plan);
    await saveMealPlan({ ...plan, name: "Updated" });
    const plans = await getAllMealPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].name).toBe("Updated");
  });

  it("stores multiple plans", async () => {
    await saveMealPlan(makePlan({ id: "p1" }));
    await saveMealPlan(makePlan({ id: "p2" }));
    const plans = await getAllMealPlans();
    expect(plans).toHaveLength(2);
  });
});

describe("getMealPlan", () => {
  it("returns a plan by id", async () => {
    await saveMealPlan(makePlan({ id: "p1", name: "Found" }));
    const plan = await getMealPlan("p1");
    expect(plan).not.toBeNull();
    expect(plan!.name).toBe("Found");
  });

  it("returns null for unknown id", async () => {
    const plan = await getMealPlan("nonexistent");
    expect(plan).toBeNull();
  });
});

describe("deleteMealPlan", () => {
  it("removes a plan", async () => {
    await saveMealPlan(makePlan({ id: "p1" }));
    await saveMealPlan(makePlan({ id: "p2" }));
    await deleteMealPlan("p1");
    const plans = await getAllMealPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe("p2");
  });

  it("clears active plan if deleted plan was active", async () => {
    await saveMealPlan(makePlan({ id: "p1" }));
    await setActivePlan("p1");
    await deleteMealPlan("p1");
    const active = await getActivePlan();
    expect(active).toBeNull();
  });
});

describe("active plan", () => {
  it("sets and gets active plan", async () => {
    const plan = makePlan({ id: "p1" });
    await saveMealPlan(plan);
    await setActivePlan("p1");
    const active = await getActivePlan();
    expect(active).not.toBeNull();
    expect(active!.id).toBe("p1");
  });

  it("returns null when no active plan", async () => {
    const active = await getActivePlan();
    expect(active).toBeNull();
  });
});

describe("toggleFavorite", () => {
  it("toggles favorite status", async () => {
    await saveMealPlan(makePlan({ id: "p1", isFavorite: false }));
    const toggled = await toggleFavorite("p1");
    expect(toggled!.isFavorite).toBe(true);
    const toggled2 = await toggleFavorite("p1");
    expect(toggled2!.isFavorite).toBe(false);
  });

  it("returns null for unknown plan", async () => {
    const result = await toggleFavorite("nonexistent");
    expect(result).toBeNull();
  });
});

describe("swapMeal", () => {
  it("replaces a meal and recalculates day macros", async () => {
    const plan = makePlan({ id: "p1" });
    await saveMealPlan(plan);

    const newMeal: PlannedMeal = {
      id: "meal-new",
      name: "Swapped Lunch",
      mealType: "lunch",
      foods: [
        {
          name: "Salmon",
          portion: "6 oz",
          macros: { calories: 350, protein: 40, carbs: 0, fat: 20 },
          confidence: 90,
        },
      ],
      totalMacros: { calories: 350, protein: 40, carbs: 0, fat: 20 },
    };

    const updated = await swapMeal("p1", 0, "meal-2", newMeal);
    expect(updated).not.toBeNull();
    expect(updated!.days[0].meals[1].name).toBe("Swapped Lunch");
    expect(updated!.days[0].totalMacros.calories).toBe(650); // 300 + 350
  });

  it("returns null for invalid plan/day/meal", async () => {
    const result = await swapMeal("nonexistent", 0, "meal-1", {} as PlannedMeal);
    expect(result).toBeNull();
  });
});

describe("grocery list", () => {
  it("saves and retrieves grocery items", async () => {
    const items: GroceryItem[] = [
      { name: "Chicken Breast", quantity: "2 lbs", category: "Protein", checked: false },
      { name: "Brown Rice", quantity: "1 bag", category: "Grains", checked: false },
    ];
    await saveGroceryList("p1", items);
    const retrieved = await getGroceryList("p1");
    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].name).toBe("Chicken Breast");
  });

  it("returns empty array when no list exists", async () => {
    const items = await getGroceryList("nonexistent");
    expect(items).toEqual([]);
  });
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { WeeklyMealPlan, GroceryItem } from "../types";
import { safeParse } from "./safeParse";

const PLANS_KEY = "caltrack_meal_plans";
const ACTIVE_PLAN_KEY = "caltrack_active_meal_plan";
const GROCERY_KEY_PREFIX = "caltrack_grocery_";

export async function saveMealPlan(plan: WeeklyMealPlan): Promise<void> {
  const plans = await getAllMealPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.unshift(plan);
  }
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export async function getAllMealPlans(): Promise<WeeklyMealPlan[]> {
  const raw = await AsyncStorage.getItem(PLANS_KEY);
  if (!raw) return [];
  return safeParse<WeeklyMealPlan[]>(raw, [], "getAllMealPlans");
}

export async function getMealPlan(id: string): Promise<WeeklyMealPlan | null> {
  const plans = await getAllMealPlans();
  return plans.find((p) => p.id === id) || null;
}

export async function deleteMealPlan(id: string): Promise<void> {
  const plans = await getAllMealPlans();
  const filtered = plans.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(filtered));
  // Clear active if it was this plan
  const activeId = await AsyncStorage.getItem(ACTIVE_PLAN_KEY);
  if (activeId === id) {
    await AsyncStorage.removeItem(ACTIVE_PLAN_KEY);
  }
}

export async function setActivePlan(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_PLAN_KEY, id);
}

export async function getActivePlan(): Promise<WeeklyMealPlan | null> {
  const activeId = await AsyncStorage.getItem(ACTIVE_PLAN_KEY);
  if (!activeId) return null;
  return getMealPlan(activeId);
}

export async function toggleFavorite(id: string): Promise<WeeklyMealPlan | null> {
  const plans = await getAllMealPlans();
  const plan = plans.find((p) => p.id === id);
  if (!plan) return null;
  plan.isFavorite = !plan.isFavorite;
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  return plan;
}

export async function swapMeal(
  planId: string,
  dayIndex: number,
  mealId: string,
  newMeal: WeeklyMealPlan["days"][0]["meals"][0]
): Promise<WeeklyMealPlan | null> {
  const plans = await getAllMealPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan || !plan.days[dayIndex]) return null;

  const day = plan.days[dayIndex];
  const mealIdx = day.meals.findIndex((m) => m.id === mealId);
  if (mealIdx < 0) return null;

  day.meals[mealIdx] = newMeal;
  day.totalMacros = day.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalMacros.calories,
      protein: acc.protein + m.totalMacros.protein,
      carbs: acc.carbs + m.totalMacros.carbs,
      fat: acc.fat + m.totalMacros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  return plan;
}

export async function getGroceryList(planId: string): Promise<GroceryItem[]> {
  const raw = await AsyncStorage.getItem(GROCERY_KEY_PREFIX + planId);
  if (!raw) return [];
  return safeParse<GroceryItem[]>(raw, [], "getGroceryList");
}

export async function saveGroceryList(
  planId: string,
  items: GroceryItem[]
): Promise<void> {
  await AsyncStorage.setItem(
    GROCERY_KEY_PREFIX + planId,
    JSON.stringify(items)
  );
}

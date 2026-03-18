import { NativeModules, Platform } from "react-native";
import { DailyLog, UserGoals } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { WidgetDataBridge } = NativeModules;

interface WidgetData {
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  carbsConsumed: number;
  carbsGoal: number;
  fatConsumed: number;
  fatGoal: number;
  lastMealName: string;
  lastMealTime: number;
  lastUpdated: number;
}

export async function syncWidgetData(log: DailyLog): Promise<void> {
  if (Platform.OS !== "ios" || !WidgetDataBridge) return;

  try {
    const goalsRaw = await AsyncStorage.getItem("caltrack_user_goals");
    const goals: UserGoals | null = goalsRaw ? JSON.parse(goalsRaw) : null;

    const lastMeal = log.meals.length > 0 ? log.meals[log.meals.length - 1] : null;
    const lastMealName = lastMeal
      ? lastMeal.foods.map((f) => f.name).join(", ")
      : "";

    const data: WidgetData = {
      caloriesConsumed: Math.round(log.totalMacros.calories),
      caloriesGoal: goals?.targetCalories ?? 2000,
      proteinConsumed: Math.round(log.totalMacros.protein),
      proteinGoal: goals?.targetProtein ?? 150,
      carbsConsumed: Math.round(log.totalMacros.carbs),
      carbsGoal: goals?.targetCarbs ?? 200,
      fatConsumed: Math.round(log.totalMacros.fat),
      fatGoal: goals?.targetFat ?? 67,
      lastMealName: lastMealName.length > 40
        ? lastMealName.substring(0, 37) + "..."
        : lastMealName,
      lastMealTime: lastMeal?.timestamp ?? 0,
      lastUpdated: Date.now(),
    };

    await WidgetDataBridge.setWidgetData(data);
  } catch {
    // Non-blocking — widget sync failure should never affect app functionality
  }
}

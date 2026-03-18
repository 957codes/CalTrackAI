import { NativeModules, Platform } from "react-native";
import { DailyLog, UserGoals } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeParse } from "../utils/safeParse";

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
  waterConsumedOz: number;
  waterGoalOz: number;
  mealsLogged: number;
  streakDays: number;
  lastMealName: string;
  lastMealTime: number;
  lastUpdated: number;
}

async function calculateStreak(): Promise<number> {
  let streak = 0;
  // Check consecutive days going backwards (starting from yesterday)
  for (let i = 1; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = "caltrack_log_" + d.toISOString().split("T")[0];
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const log = safeParse<{ meals?: unknown[] }>(raw, { meals: [] }, "calculateStreak");
      if (log.meals && log.meals.length > 0) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

export async function refreshWidget(): Promise<void> {
  if (Platform.OS !== "ios" || !WidgetDataBridge) return;
  try {
    const today = new Date().toISOString().split("T")[0];
    const logRaw = await AsyncStorage.getItem("caltrack_log_" + today);
    const emptyLog: DailyLog = { date: today, meals: [], totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
    const log: DailyLog = logRaw
      ? safeParse<DailyLog>(logRaw, emptyLog, "refreshWidget")
      : emptyLog;
    await syncWidgetData(log);
  } catch {
    // Non-blocking
  }
}

export async function syncWidgetData(log: DailyLog): Promise<void> {
  if (Platform.OS !== "ios" || !WidgetDataBridge) return;

  try {
    const goalsRaw = await AsyncStorage.getItem("caltrack_user_goals");
    const goals: UserGoals | null = goalsRaw ? safeParse<UserGoals | null>(goalsRaw, null, "syncWidgetData.goals") : null;

    // Water data
    const today = new Date().toISOString().split("T")[0];
    const waterRaw = await AsyncStorage.getItem("caltrack_water_" + today);
    const waterLog = waterRaw ? safeParse<{ totalOz?: number } | null>(waterRaw, null, "syncWidgetData.water") : null;
    const waterSettingsRaw = await AsyncStorage.getItem("caltrack_water_settings");
    const waterSettings = waterSettingsRaw ? safeParse<{ dailyGoalOz?: number } | null>(waterSettingsRaw, null, "syncWidgetData.waterSettings") : null;

    const lastMeal = log.meals.length > 0 ? log.meals[log.meals.length - 1] : null;
    const lastMealName = lastMeal
      ? lastMeal.foods.map((f) => f.name).join(", ")
      : "";

    const streak = await calculateStreak();

    const data: WidgetData = {
      caloriesConsumed: Math.round(log.totalMacros.calories),
      caloriesGoal: goals?.targetCalories ?? 2000,
      proteinConsumed: Math.round(log.totalMacros.protein),
      proteinGoal: goals?.targetProtein ?? 150,
      carbsConsumed: Math.round(log.totalMacros.carbs),
      carbsGoal: goals?.targetCarbs ?? 200,
      fatConsumed: Math.round(log.totalMacros.fat),
      fatGoal: goals?.targetFat ?? 67,
      waterConsumedOz: waterLog?.totalOz ?? 0,
      waterGoalOz: waterSettings?.dailyGoalOz ?? 64,
      mealsLogged: log.meals.length,
      streakDays: streak + (log.meals.length > 0 ? 1 : 0), // Include today if logged
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

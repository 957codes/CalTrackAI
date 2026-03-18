import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog, MacroBreakdown, MealEntry } from "../types";
import { safeParse } from "./safeParse";
import { writeMealToHealthKit } from "../services/healthKitService";
import { syncWidgetData } from "../services/widgetService";
import { checkAndCelebrateStreak } from "../services/mealReminders";
import { isOnline } from "../services/networkService";
import { enqueue } from "./syncQueue";

const STORAGE_KEY_PREFIX = "caltrack_log_";

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function emptyMacros(): MacroBreakdown {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function sumMacros(meals: MealEntry[]): MacroBreakdown {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalMacros.calories,
      protein: acc.protein + meal.totalMacros.protein,
      carbs: acc.carbs + meal.totalMacros.carbs,
      fat: acc.fat + meal.totalMacros.fat,
    }),
    emptyMacros()
  );
}

export async function getDailyLog(date: Date = new Date()): Promise<DailyLog> {
  const key = STORAGE_KEY_PREFIX + getDateKey(date);
  const raw = await AsyncStorage.getItem(key);
  const empty = { date: getDateKey(date), meals: [], totalMacros: emptyMacros() };
  if (raw) return safeParse<DailyLog>(raw, empty, "getDailyLog");
  return empty;
}

export async function addMealEntry(meal: MealEntry): Promise<DailyLog> {
  const today = new Date();
  const log = await getDailyLog(today);
  log.meals.push(meal);
  log.totalMacros = sumMacros(log.meals);
  const key = STORAGE_KEY_PREFIX + getDateKey(today);
  await AsyncStorage.setItem(key, JSON.stringify(log));

  if (isOnline()) {
    // Sync to Apple Health (non-blocking — failure doesn't affect meal save)
    writeMealToHealthKit(meal.totalMacros, meal.timestamp).catch(() => {});
  } else {
    // Queue HealthKit sync for when connectivity returns
    enqueue({
      type: "meal_healthkit",
      payload: { macros: meal.totalMacros, timestamp: meal.timestamp },
    }).catch(() => {});
  }

  // Sync to home screen widget (non-blocking, works offline via native bridge)
  syncWidgetData(log).catch(() => {});

  // Check for streak milestones (non-blocking)
  checkAndCelebrateStreak().catch(() => {});

  return log;
}

export async function deleteMealEntry(mealId: string): Promise<DailyLog> {
  const today = new Date();
  const log = await getDailyLog(today);
  log.meals = log.meals.filter((m) => m.id !== mealId);
  log.totalMacros = sumMacros(log.meals);
  const key = STORAGE_KEY_PREFIX + getDateKey(today);
  await AsyncStorage.setItem(key, JSON.stringify(log));

  // Sync to home screen widget (non-blocking)
  syncWidgetData(log).catch(() => {});

  return log;
}

export async function getWeekLogs(): Promise<DailyLog[]> {
  const logs: DailyLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push(await getDailyLog(d));
  }
  return logs;
}

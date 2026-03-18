import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyWaterLog, WaterEntry, WaterSettings } from "../types";
import { writeWaterToHealthKit } from "../services/healthKitService";
import { refreshWidget } from "../services/widgetService";

const WATER_LOG_PREFIX = "caltrack_water_";
const WATER_SETTINGS_KEY = "caltrack_water_settings";

const DEFAULT_WATER_SETTINGS: WaterSettings = {
  dailyGoalOz: 64,
  remindersEnabled: false,
  reminderIntervalHours: 2,
  reminderStartHour: 8,
  reminderEndHour: 22,
};

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export async function getDailyWaterLog(
  date: Date = new Date()
): Promise<DailyWaterLog> {
  const key = WATER_LOG_PREFIX + getDateKey(date);
  const raw = await AsyncStorage.getItem(key);
  if (raw) return JSON.parse(raw);
  return { date: getDateKey(date), entries: [], totalOz: 0 };
}

export async function addWaterEntry(amountOz: number): Promise<DailyWaterLog> {
  const now = new Date();
  const log = await getDailyWaterLog(now);
  const entry: WaterEntry = {
    id: `water_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now.getTime(),
    amountOz,
  };
  log.entries.push(entry);
  log.totalOz = log.entries.reduce((sum, e) => sum + e.amountOz, 0);
  const key = WATER_LOG_PREFIX + getDateKey(now);
  await AsyncStorage.setItem(key, JSON.stringify(log));

  // Sync to HealthKit (non-blocking)
  writeWaterToHealthKit(amountOz, now.getTime()).catch(() => {});

  // Refresh widget (non-blocking)
  refreshWidget().catch(() => {});

  return log;
}

export async function deleteWaterEntry(
  entryId: string
): Promise<DailyWaterLog> {
  const now = new Date();
  const log = await getDailyWaterLog(now);
  log.entries = log.entries.filter((e) => e.id !== entryId);
  log.totalOz = log.entries.reduce((sum, e) => sum + e.amountOz, 0);
  const key = WATER_LOG_PREFIX + getDateKey(now);
  await AsyncStorage.setItem(key, JSON.stringify(log));
  return log;
}

export async function getWeekWaterLogs(): Promise<DailyWaterLog[]> {
  const logs: DailyWaterLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push(await getDailyWaterLog(d));
  }
  return logs;
}

export async function getWaterSettings(): Promise<WaterSettings> {
  const raw = await AsyncStorage.getItem(WATER_SETTINGS_KEY);
  if (raw) return JSON.parse(raw);
  return { ...DEFAULT_WATER_SETTINGS };
}

export async function saveWaterSettings(
  settings: WaterSettings
): Promise<void> {
  await AsyncStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(settings));
}

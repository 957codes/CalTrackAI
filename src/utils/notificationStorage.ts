import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationSettings } from "../types";

const STORAGE_KEY = "caltrack_notification_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  mealReminders: {
    enabled: false,
    breakfastHour: 8,
    lunchHour: 12,
    dinnerHour: 18,
  },
  streakCelebrations: true,
  inactivityNudge: false,
  inactivityNudgeHour: 14, // 2pm
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  return DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

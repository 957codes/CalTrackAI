import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationSettings } from "../types";
import { safeParse } from "../utils/safeParse";
import {
  getNotificationSettings,
} from "../utils/notificationStorage";
import { requestNotificationPermissions } from "./hydrationReminders";

// ── Meal Reminder Scheduling ──────────────────────────────────────────

const MEAL_REMINDER_IDS = [
  "meal-reminder-breakfast",
  "meal-reminder-lunch",
  "meal-reminder-dinner",
];

const MEAL_LABELS: Record<string, { title: string; body: string }> = {
  "meal-reminder-breakfast": {
    title: "Good morning!",
    body: "Time for breakfast — snap a photo to start tracking today.",
  },
  "meal-reminder-lunch": {
    title: "Lunchtime!",
    body: "Don't forget to log your lunch.",
  },
  "meal-reminder-dinner": {
    title: "Dinner time!",
    body: "Log your dinner to stay on track.",
  },
};

export async function scheduleMealReminders(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.mealReminders.enabled) {
    await cancelMealReminders();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await cancelMealReminders();

  const hours = [
    { id: MEAL_REMINDER_IDS[0], hour: settings.mealReminders.breakfastHour },
    { id: MEAL_REMINDER_IDS[1], hour: settings.mealReminders.lunchHour },
    { id: MEAL_REMINDER_IDS[2], hour: settings.mealReminders.dinnerHour },
  ];

  for (const { id, hour } of hours) {
    const label = MEAL_LABELS[id];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: label.title,
        body: label.body,
        data: { type: "meal_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
      identifier: id,
    });
  }
}

export async function cancelMealReminders(): Promise<void> {
  for (const id of MEAL_REMINDER_IDS) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

// ── Inactivity Nudge ──────────────────────────────────────────────────

const INACTIVITY_NUDGE_ID = "inactivity-nudge";

export async function scheduleInactivityNudge(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.inactivityNudge) {
    await cancelInactivityNudge();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await cancelInactivityNudge();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Haven't logged lunch yet?",
      body: "A quick photo keeps your tracking streak alive!",
      data: { type: "inactivity_nudge" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.inactivityNudgeHour,
      minute: 0,
    },
    identifier: INACTIVITY_NUDGE_ID,
  });
}

export async function cancelInactivityNudge(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(INACTIVITY_NUDGE_ID);
}

// ── Streak Celebrations ───────────────────────────────────────────────

const STREAK_LAST_CELEBRATED_KEY = "caltrack_streak_last_celebrated";

async function calculateStreak(): Promise<number> {
  let streak = 0;
  for (let i = 1; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = "caltrack_log_" + d.toISOString().split("T")[0];
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const log = safeParse<{ meals?: unknown[] }>(raw, { meals: [] }, "mealReminders.calculateStreak");
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

const STREAK_MILESTONES = [3, 7, 14, 21, 30];
const STREAK_MESSAGES: Record<number, string> = {
  3: "3 days in a row! You're building a habit.",
  7: "One full week! Your consistency is paying off.",
  14: "Two weeks strong! You're a tracking machine.",
  21: "21 days — that's a real habit now!",
  30: "30-day streak! You're absolutely crushing it.",
};

export async function checkAndCelebrateStreak(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.streakCelebrations) return;

  // Include today if meals are logged
  const todayKey =
    "caltrack_log_" + new Date().toISOString().split("T")[0];
  const todayRaw = await AsyncStorage.getItem(todayKey);
  const todayHasMeals =
    todayRaw && safeParse<{ meals?: unknown[] }>(todayRaw, { meals: [] }, "mealReminders.todayCheck").meals?.length! > 0;
  if (!todayHasMeals) return;

  const pastStreak = await calculateStreak();
  const totalStreak = pastStreak + 1; // +1 for today

  const milestone = STREAK_MILESTONES.find((m) => m === totalStreak);
  if (!milestone) return;

  // Check if we already celebrated this milestone
  const lastCelebrated = await AsyncStorage.getItem(
    STREAK_LAST_CELEBRATED_KEY
  );
  if (lastCelebrated === String(milestone)) return;

  await AsyncStorage.setItem(
    STREAK_LAST_CELEBRATED_KEY,
    String(milestone)
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${milestone}-Day Streak!`,
      body: STREAK_MESSAGES[milestone],
      data: { type: "streak_celebration", streak: milestone },
    },
    trigger: null, // fire immediately
  });
}

// ── Reschedule All ────────────────────────────────────────────────────

export async function rescheduleAllMealNotifications(): Promise<void> {
  await scheduleMealReminders();
  await scheduleInactivityNudge();
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  scheduleMealReminders,
  cancelMealReminders,
  scheduleInactivityNudge,
  cancelInactivityNudge,
  checkAndCelebrateStreak,
  rescheduleAllMealNotifications,
} from "../services/mealReminders";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// Helper to set notification settings
async function setNotificationSettings(overrides: Record<string, any> = {}) {
  const defaults = {
    mealReminders: { enabled: true, breakfastHour: 8, lunchHour: 12, dinnerHour: 18 },
    streakCelebrations: true,
    inactivityNudge: true,
    inactivityNudgeHour: 14,
  };
  await AsyncStorage.setItem(
    "caltrack_notification_settings",
    JSON.stringify({ ...defaults, ...overrides })
  );
}

// Helper to add a meal log for a specific date
async function addMealLog(date: Date) {
  const key = "caltrack_log_" + date.toISOString().split("T")[0];
  await AsyncStorage.setItem(
    key,
    JSON.stringify({ date: date.toISOString().split("T")[0], meals: [{ id: "m1" }], totalMacros: {} })
  );
}

describe("scheduleMealReminders", () => {
  it("schedules 3 daily reminders when enabled", async () => {
    await setNotificationSettings();
    await scheduleMealReminders();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
  });

  it("cancels existing reminders before scheduling", async () => {
    await setNotificationSettings();
    await scheduleMealReminders();
    // cancelMealReminders calls cancelScheduledNotificationAsync 3 times
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
  });

  it("only cancels (does not schedule) when disabled", async () => {
    await setNotificationSettings({
      mealReminders: { enabled: false, breakfastHour: 8, lunchHour: 12, dinnerHour: 18 },
    });
    await scheduleMealReminders();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe("cancelMealReminders", () => {
  it("cancels all 3 meal reminder IDs", async () => {
    await cancelMealReminders();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("meal-reminder-breakfast");
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("meal-reminder-lunch");
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("meal-reminder-dinner");
  });
});

describe("scheduleInactivityNudge", () => {
  it("schedules nudge at configured hour", async () => {
    await setNotificationSettings({ inactivityNudge: true, inactivityNudgeHour: 15 });
    await scheduleInactivityNudge();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "inactivity-nudge",
        trigger: expect.objectContaining({ hour: 15 }),
      })
    );
  });

  it("cancels nudge when disabled", async () => {
    await setNotificationSettings({ inactivityNudge: false });
    await scheduleInactivityNudge();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("inactivity-nudge");
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe("checkAndCelebrateStreak", () => {
  it("does nothing when streak celebrations are disabled", async () => {
    await setNotificationSettings({ streakCelebrations: false });
    await checkAndCelebrateStreak();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does nothing when no meals logged today", async () => {
    await setNotificationSettings();
    await checkAndCelebrateStreak();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("fires notification on 3-day milestone", async () => {
    await setNotificationSettings();
    const today = new Date();
    // Log today + 2 previous days = 3-day streak
    await addMealLog(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    await addMealLog(yesterday);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    await addMealLog(twoDaysAgo);

    await checkAndCelebrateStreak();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "3-Day Streak!",
        }),
      })
    );
  });

  it("does not re-celebrate the same milestone", async () => {
    await setNotificationSettings();
    const today = new Date();
    await addMealLog(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    await addMealLog(yesterday);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    await addMealLog(twoDaysAgo);

    await checkAndCelebrateStreak();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    await checkAndCelebrateStreak();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe("rescheduleAllMealNotifications", () => {
  it("calls both scheduleMealReminders and scheduleInactivityNudge", async () => {
    await setNotificationSettings();
    await rescheduleAllMealNotifications();
    // 3 meal reminders + 1 inactivity nudge
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
  });
});

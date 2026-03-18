/**
 * Tests for notification settings storage — defaults, save, load.
 */
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "../utils/notificationStorage";

const store = (globalThis as any).__asyncStorageMock;

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("getNotificationSettings", () => {
  it("returns defaults when nothing saved", async () => {
    const settings = await getNotificationSettings();
    expect(settings.mealReminders.enabled).toBe(false);
    expect(settings.mealReminders.breakfastHour).toBe(8);
    expect(settings.mealReminders.lunchHour).toBe(12);
    expect(settings.mealReminders.dinnerHour).toBe(18);
    expect(settings.streakCelebrations).toBe(true);
    expect(settings.inactivityNudge).toBe(false);
    expect(settings.inactivityNudgeHour).toBe(14);
  });

  it("returns saved settings", async () => {
    await saveNotificationSettings({
      mealReminders: { enabled: true, breakfastHour: 7, lunchHour: 11, dinnerHour: 19 },
      streakCelebrations: false,
      inactivityNudge: true,
      inactivityNudgeHour: 15,
    });

    const settings = await getNotificationSettings();
    expect(settings.mealReminders.enabled).toBe(true);
    expect(settings.mealReminders.breakfastHour).toBe(7);
    expect(settings.streakCelebrations).toBe(false);
    expect(settings.inactivityNudge).toBe(true);
    expect(settings.inactivityNudgeHour).toBe(15);
  });

  it("merges partial saved data with defaults", async () => {
    // Simulate a partially saved object (e.g. from older version)
    store["caltrack_notification_settings"] = JSON.stringify({
      mealReminders: { enabled: true, breakfastHour: 9, lunchHour: 13, dinnerHour: 20 },
    });

    const settings = await getNotificationSettings();
    expect(settings.mealReminders.enabled).toBe(true);
    // Should have default values for missing fields
    expect(settings.streakCelebrations).toBe(true);
    expect(settings.inactivityNudge).toBe(false);
    expect(settings.inactivityNudgeHour).toBe(14);
  });
});

describe("saveNotificationSettings", () => {
  it("persists settings to storage", async () => {
    await saveNotificationSettings({
      mealReminders: { enabled: true, breakfastHour: 8, lunchHour: 12, dinnerHour: 18 },
      streakCelebrations: true,
      inactivityNudge: true,
      inactivityNudgeHour: 14,
    });

    expect(store["caltrack_notification_settings"]).toBeDefined();
    const parsed = JSON.parse(store["caltrack_notification_settings"]);
    expect(parsed.mealReminders.enabled).toBe(true);
    expect(parsed.inactivityNudge).toBe(true);
  });

  it("overwrites previous settings", async () => {
    await saveNotificationSettings({
      mealReminders: { enabled: true, breakfastHour: 8, lunchHour: 12, dinnerHour: 18 },
      streakCelebrations: true,
      inactivityNudge: false,
      inactivityNudgeHour: 14,
    });
    await saveNotificationSettings({
      mealReminders: { enabled: false, breakfastHour: 9, lunchHour: 13, dinnerHour: 19 },
      streakCelebrations: false,
      inactivityNudge: true,
      inactivityNudgeHour: 15,
    });

    const settings = await getNotificationSettings();
    expect(settings.mealReminders.enabled).toBe(false);
    expect(settings.mealReminders.breakfastHour).toBe(9);
    expect(settings.streakCelebrations).toBe(false);
    expect(settings.inactivityNudge).toBe(true);
  });
});

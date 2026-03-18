import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDailyWaterLog,
  addWaterEntry,
  deleteWaterEntry,
  getWeekWaterLogs,
  getWaterSettings,
  saveWaterSettings,
} from "../utils/waterStorage";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("getDailyWaterLog", () => {
  it("returns empty log when no data exists", async () => {
    const log = await getDailyWaterLog();
    expect(log.entries).toEqual([]);
    expect(log.totalOz).toBe(0);
    expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns existing water log data", async () => {
    const today = new Date().toISOString().split("T")[0];
    const storedLog = {
      date: today,
      entries: [{ id: "w1", timestamp: Date.now(), amountOz: 8 }],
      totalOz: 8,
    };
    await AsyncStorage.setItem(`caltrack_water_${today}`, JSON.stringify(storedLog));

    const log = await getDailyWaterLog();
    expect(log.entries).toHaveLength(1);
    expect(log.totalOz).toBe(8);
  });
});

describe("addWaterEntry", () => {
  it("adds a water entry and updates total", async () => {
    const log = await addWaterEntry(8);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].amountOz).toBe(8);
    expect(log.totalOz).toBe(8);
  });

  it("accumulates multiple water entries", async () => {
    await addWaterEntry(8);
    await addWaterEntry(12);
    const log = await addWaterEntry(16);
    expect(log.entries).toHaveLength(3);
    expect(log.totalOz).toBe(36);
  });

  it("persists to AsyncStorage", async () => {
    await addWaterEntry(16);
    const today = new Date().toISOString().split("T")[0];
    const stored = await AsyncStorage.getItem(`caltrack_water_${today}`);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.totalOz).toBe(16);
  });
});

describe("deleteWaterEntry", () => {
  it("removes an entry and recalculates total", async () => {
    const log1 = await addWaterEntry(8);
    await addWaterEntry(16);

    const log = await deleteWaterEntry(log1.entries[0].id);
    expect(log.entries).toHaveLength(1);
    expect(log.totalOz).toBe(16);
  });

  it("handles deleting non-existent entry gracefully", async () => {
    await addWaterEntry(8);
    const log = await deleteWaterEntry("does-not-exist");
    expect(log.entries).toHaveLength(1);
    expect(log.totalOz).toBe(8);
  });
});

describe("getWeekWaterLogs", () => {
  it("returns 7 days of logs", async () => {
    const logs = await getWeekWaterLogs();
    expect(logs).toHaveLength(7);
  });

  it("returns logs in chronological order", async () => {
    const logs = await getWeekWaterLogs();
    for (let i = 1; i < logs.length; i++) {
      expect(logs[i].date >= logs[i - 1].date).toBe(true);
    }
  });
});

describe("waterSettings", () => {
  it("returns defaults when no settings exist", async () => {
    const settings = await getWaterSettings();
    expect(settings.dailyGoalOz).toBe(64);
    expect(settings.remindersEnabled).toBe(false);
    expect(settings.reminderIntervalHours).toBe(2);
    expect(settings.reminderStartHour).toBe(8);
    expect(settings.reminderEndHour).toBe(22);
  });

  it("saves and retrieves custom settings", async () => {
    await saveWaterSettings({
      dailyGoalOz: 80,
      remindersEnabled: true,
      reminderIntervalHours: 3,
      reminderStartHour: 9,
      reminderEndHour: 21,
    });
    const settings = await getWaterSettings();
    expect(settings.dailyGoalOz).toBe(80);
    expect(settings.remindersEnabled).toBe(true);
    expect(settings.reminderIntervalHours).toBe(3);
  });
});

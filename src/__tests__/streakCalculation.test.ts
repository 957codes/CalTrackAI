/**
 * Tests for streak calculation logic in widgetService.
 * calculateStreak is private, but we can test it indirectly via syncWidgetData.
 */
import { NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog } from "../types";

const store = (globalThis as any).__asyncStorageMock;

function makeLog(date: string, mealCount: number): DailyLog {
  const meals = Array.from({ length: mealCount }, (_, i) => ({
    id: `meal-${i}`,
    timestamp: new Date(date).getTime(),
    photoUri: null,
    foods: [
      {
        name: "Test Food",
        portion: "1 cup",
        macros: { calories: 300, protein: 20, carbs: 30, fat: 10 },
        confidence: 85,
      },
    ],
    totalMacros: { calories: 300, protein: 20, carbs: 30, fat: 10 },
    overallConfidence: 85,
  }));

  return {
    date,
    meals,
    totalMacros: {
      calories: 300 * mealCount,
      protein: 20 * mealCount,
      carbs: 30 * mealCount,
      fat: 10 * mealCount,
    },
  };
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
});

describe("streak calculation via syncWidgetData", () => {
  it("reports 0 streak when no previous days logged", async () => {
    const { syncWidgetData } = require("../services/widgetService");
    const todayLog = makeLog(dateStr(0), 1);
    await syncWidgetData(todayLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    // streak = 0 (no past days) + 1 (today has meals) = 1
    expect(call.streakDays).toBe(1);
  });

  it("reports correct streak for consecutive days", async () => {
    const { syncWidgetData } = require("../services/widgetService");

    // Set up 3 consecutive days before today
    for (let i = 1; i <= 3; i++) {
      const date = dateStr(i);
      const log = makeLog(date, 2);
      await AsyncStorage.setItem("caltrack_log_" + date, JSON.stringify(log));
    }

    const todayLog = makeLog(dateStr(0), 1);
    await syncWidgetData(todayLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    // streak = 3 past days + 1 today = 4
    expect(call.streakDays).toBe(4);
  });

  it("breaks streak on missed day", async () => {
    const { syncWidgetData } = require("../services/widgetService");

    // Day 1 ago: logged, Day 2 ago: missed, Day 3 ago: logged
    const day1 = dateStr(1);
    await AsyncStorage.setItem(
      "caltrack_log_" + day1,
      JSON.stringify(makeLog(day1, 1))
    );
    // Day 2 ago: no entry
    const day3 = dateStr(3);
    await AsyncStorage.setItem(
      "caltrack_log_" + day3,
      JSON.stringify(makeLog(day3, 1))
    );

    const todayLog = makeLog(dateStr(0), 1);
    await syncWidgetData(todayLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    // streak = 1 (yesterday) + 1 (today) = 2
    expect(call.streakDays).toBe(2);
  });

  it("reports 0 streak when today has no meals and no past days", async () => {
    const { syncWidgetData } = require("../services/widgetService");
    const emptyLog = makeLog(dateStr(0), 0);
    await syncWidgetData(emptyLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    expect(call.streakDays).toBe(0);
  });

  it("does not count today as streak if no meals today", async () => {
    const { syncWidgetData } = require("../services/widgetService");

    // Yesterday had meals
    const yesterday = dateStr(1);
    await AsyncStorage.setItem(
      "caltrack_log_" + yesterday,
      JSON.stringify(makeLog(yesterday, 2))
    );

    const todayLog = makeLog(dateStr(0), 0);
    await syncWidgetData(todayLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    // streak = 1 (yesterday) + 0 (today no meals) = 1
    expect(call.streakDays).toBe(1);
  });

  it("counts empty meals array as no-log day", async () => {
    const { syncWidgetData } = require("../services/widgetService");

    // Yesterday has log entry but empty meals array
    const yesterday = dateStr(1);
    await AsyncStorage.setItem(
      "caltrack_log_" + yesterday,
      JSON.stringify({ date: yesterday, meals: [], totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 } })
    );

    const todayLog = makeLog(dateStr(0), 1);
    await syncWidgetData(todayLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    // streak = 0 (yesterday empty) + 1 (today) = 1
    expect(call.streakDays).toBe(1);
  });

  it("handles long streak up to 30 days", async () => {
    const { syncWidgetData } = require("../services/widgetService");

    for (let i = 1; i <= 30; i++) {
      const date = dateStr(i);
      await AsyncStorage.setItem(
        "caltrack_log_" + date,
        JSON.stringify(makeLog(date, 1))
      );
    }

    const todayLog = makeLog(dateStr(0), 1);
    await syncWidgetData(todayLog);

    const call = (NativeModules.WidgetDataBridge.setWidgetData as jest.Mock)
      .mock.calls[0][0];
    expect(call.streakDays).toBe(31); // 30 past + 1 today
  });
});

import { NativeModules } from "react-native";
import { syncWidgetData } from "../services/widgetService";
import { DailyLog } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockSetWidgetData = NativeModules.WidgetDataBridge.setWidgetData as jest.Mock;

beforeEach(async () => {
  mockSetWidgetData.mockClear();
  await AsyncStorage.clear();
});

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    date: "2026-03-18",
    meals: [],
    totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ...overrides,
  };
}

describe("syncWidgetData", () => {
  it("calls WidgetDataBridge.setWidgetData with correct data", async () => {
    // Set up user goals
    await AsyncStorage.setItem(
      "caltrack_user_goals",
      JSON.stringify({
        weightGoal: "maintain",
        activityLevel: "moderate",
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFat: 67,
      })
    );

    const log = makeLog({
      totalMacros: { calories: 1200, protein: 80, carbs: 120, fat: 40 },
    });

    await syncWidgetData(log);

    expect(mockSetWidgetData).toHaveBeenCalledTimes(1);
    const data = mockSetWidgetData.mock.calls[0][0];
    expect(data.caloriesConsumed).toBe(1200);
    expect(data.caloriesGoal).toBe(2000);
    expect(data.proteinConsumed).toBe(80);
    expect(data.proteinGoal).toBe(150);
  });

  it("uses default goals when none are saved", async () => {
    const log = makeLog({
      totalMacros: { calories: 500, protein: 30, carbs: 60, fat: 15 },
    });

    await syncWidgetData(log);

    const data = mockSetWidgetData.mock.calls[0][0];
    expect(data.caloriesGoal).toBe(2000);
    expect(data.proteinGoal).toBe(150);
  });

  it("includes last meal info when meals exist", async () => {
    const log = makeLog({
      meals: [
        {
          id: "m1",
          timestamp: 1710760200000,
          photoUri: null,
          foods: [
            { name: "Chicken", portion: "6oz", macros: { calories: 280, protein: 53, carbs: 0, fat: 6 }, confidence: 90 },
            { name: "Rice", portion: "1cup", macros: { calories: 215, protein: 5, carbs: 45, fat: 2 }, confidence: 85 },
          ],
          totalMacros: { calories: 495, protein: 58, carbs: 45, fat: 8 },
          overallConfidence: 87,
        },
      ],
      totalMacros: { calories: 495, protein: 58, carbs: 45, fat: 8 },
    });

    await syncWidgetData(log);

    const data = mockSetWidgetData.mock.calls[0][0];
    expect(data.lastMealName).toBe("Chicken, Rice");
    expect(data.lastMealTime).toBe(1710760200000);
  });

  it("truncates long meal names", async () => {
    const log = makeLog({
      meals: [
        {
          id: "m1",
          timestamp: Date.now(),
          photoUri: null,
          foods: [
            { name: "Grilled Chicken Breast with Herbs", portion: "6oz", macros: { calories: 280, protein: 53, carbs: 0, fat: 6 }, confidence: 90 },
            { name: "Steamed Broccoli with Garlic Butter", portion: "1cup", macros: { calories: 55, protein: 4, carbs: 11, fat: 1 }, confidence: 85 },
          ],
          totalMacros: { calories: 335, protein: 57, carbs: 11, fat: 7 },
          overallConfidence: 87,
        },
      ],
      totalMacros: { calories: 335, protein: 57, carbs: 11, fat: 7 },
    });

    await syncWidgetData(log);

    const data = mockSetWidgetData.mock.calls[0][0];
    expect(data.lastMealName.length).toBeLessThanOrEqual(40);
    expect(data.lastMealName).toContain("...");
  });

  it("handles empty log gracefully", async () => {
    const log = makeLog();
    await syncWidgetData(log);

    const data = mockSetWidgetData.mock.calls[0][0];
    expect(data.caloriesConsumed).toBe(0);
    expect(data.lastMealName).toBe("");
    expect(data.lastMealTime).toBe(0);
  });
});

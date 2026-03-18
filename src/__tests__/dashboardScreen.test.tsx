/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "../theme";
import { DailyLog, MacroBreakdown } from "../types";

// Mock storage/onboarding
const mockGetDailyLog = jest.fn();
const mockGetWeekLogs = jest.fn();
const mockGetUserGoals = jest.fn();

jest.mock("../utils/storage", () => ({
  getDailyLog: (...args: any[]) => mockGetDailyLog(...args),
  getWeekLogs: (...args: any[]) => mockGetWeekLogs(...args),
}));

jest.mock("../utils/onboarding", () => ({
  getUserGoals: (...args: any[]) => mockGetUserGoals(...args),
}));

import DashboardScreen from "../../app/(tabs)/dashboard";

const emptyMacros: MacroBreakdown = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

function makeDailyLog(
  date: string,
  macros: Partial<MacroBreakdown> = {},
  mealCount = 1
): DailyLog {
  const totalMacros = { ...emptyMacros, ...macros };
  return {
    date,
    meals: Array.from({ length: mealCount }, (_, i) => ({
      id: `${date}-meal-${i}`,
      timestamp: new Date(date).getTime(),
      photoUri: null,
      foods: [
        {
          name: "Test food",
          portion: "1 serving",
          macros: {
            calories: totalMacros.calories / Math.max(mealCount, 1),
            protein: totalMacros.protein / Math.max(mealCount, 1),
            carbs: totalMacros.carbs / Math.max(mealCount, 1),
            fat: totalMacros.fat / Math.max(mealCount, 1),
          },
          confidence: 85,
          category: "main" as const,
          corrected: false,
        },
      ],
      totalMacros,
      overallConfidence: 85,
      userVerified: false,
    })),
    totalMacros,
  };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <DashboardScreen />
    </ThemeProvider>
  );
}

describe("DashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with tracked meals", () => {
    const todayLog = makeDailyLog("2026-03-18", {
      calories: 1250,
      protein: 95,
      carbs: 130,
      fat: 42,
    }, 2);

    const weekLogs = [
      makeDailyLog("2026-03-12", { calories: 1800, protein: 120, carbs: 200, fat: 60 }),
      makeDailyLog("2026-03-13", { calories: 0, protein: 0, carbs: 0, fat: 0 }, 0),
      makeDailyLog("2026-03-14", { calories: 2100, protein: 150, carbs: 220, fat: 70 }),
      makeDailyLog("2026-03-15", { calories: 1950, protein: 140, carbs: 210, fat: 65 }),
      makeDailyLog("2026-03-16", { calories: 1600, protein: 100, carbs: 180, fat: 55 }),
      makeDailyLog("2026-03-17", { calories: 2200, protein: 160, carbs: 230, fat: 73 }),
      makeDailyLog("2026-03-18", { calories: 1250, protein: 95, carbs: 130, fat: 42 }, 2),
    ];

    beforeEach(() => {
      mockGetDailyLog.mockResolvedValue(todayLog);
      mockGetWeekLogs.mockResolvedValue(weekLogs);
      mockGetUserGoals.mockResolvedValue(null);
    });

    it("renders daily progress section", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("Daily Progress")).toBeTruthy();
      });
    });

    it("shows calorie progress with default goals", async () => {
      renderScreen();

      await waitFor(() => {
        // Default goal is 2000 kcal
        expect(screen.getByText("1250 / 2000 kcal")).toBeTruthy();
      });
    });

    it("shows protein progress with default goals", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("95 / 150 g")).toBeTruthy();
      });
    });

    it("shows week section", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("This Week")).toBeTruthy();
      });
    });

    it("shows week summary stats", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("Week Summary")).toBeTruthy();
        expect(screen.getByText("Avg Calories")).toBeTruthy();
        expect(screen.getByText("Total Meals")).toBeTruthy();
        expect(screen.getByText("Days Logged")).toBeTruthy();
      });
    });

    it("calculates correct total meals count", async () => {
      renderScreen();

      // 1+0+1+1+1+1+2 = 7 total meals
      await waitFor(() => {
        expect(screen.getByText(/7\s*meals/)).toBeTruthy();
      });
    });

    it("calculates correct days logged (days with meals)", async () => {
      renderScreen();

      // 6 days with meals (one day has 0 meals)
      await waitFor(() => {
        expect(screen.getByText(/6\s*\/\s*7/)).toBeTruthy();
      });
    });
  });

  describe("with custom goals", () => {
    beforeEach(() => {
      mockGetDailyLog.mockResolvedValue(
        makeDailyLog("2026-03-18", { calories: 800, protein: 60, carbs: 80, fat: 30 })
      );
      mockGetWeekLogs.mockResolvedValue([
        makeDailyLog("2026-03-18", { calories: 800, protein: 60, carbs: 80, fat: 30 }),
      ]);
      mockGetUserGoals.mockResolvedValue({
        weightGoal: "lose",
        activityLevel: "moderate",
        targetCalories: 1800,
        targetProtein: 135,
        targetCarbs: 180,
        targetFat: 60,
      });
    });

    it("uses custom calorie goal", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("800 / 1800 kcal")).toBeTruthy();
      });
    });

    it("uses custom protein goal", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("60 / 135 g")).toBeTruthy();
      });
    });
  });

  describe("empty state", () => {
    it("renders null when today log is not loaded", () => {
      mockGetDailyLog.mockResolvedValue(null);
      mockGetWeekLogs.mockResolvedValue([]);
      mockGetUserGoals.mockResolvedValue(null);

      const { toJSON } = renderScreen();
      // Returns null before data loads
      expect(toJSON()).toBeNull();
    });
  });

  describe("with zero calories", () => {
    beforeEach(() => {
      mockGetDailyLog.mockResolvedValue(
        makeDailyLog("2026-03-18", emptyMacros, 0)
      );
      mockGetWeekLogs.mockResolvedValue([
        makeDailyLog("2026-03-18", emptyMacros, 0),
      ]);
      mockGetUserGoals.mockResolvedValue(null);
    });

    it("shows zero progress", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("0 / 2000 kcal")).toBeTruthy();
      });
    });

    it("shows 0 days logged", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("0")).toBeTruthy();
      });
    });
  });
});

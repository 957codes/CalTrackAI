import React from "react";
import { render, waitFor } from "@testing-library/react-native";

// Mock theme
jest.mock("../theme", () => {
  const { darkColors } = jest.requireActual("../theme/colors");
  return {
    useTheme: () => darkColors,
    ThemeProvider: ({ children }: any) => children,
    darkColors,
    lightColors: darkColors,
  };
});

// Mock storage
const mockGetDailyLog = jest.fn();
const mockGetWeekLogs = jest.fn();
jest.mock("../utils/storage", () => ({
  getDailyLog: (...args: any[]) => mockGetDailyLog(...args),
  getWeekLogs: (...args: any[]) => mockGetWeekLogs(...args),
}));

// Mock onboarding
const mockGetUserGoals = jest.fn();
jest.mock("../utils/onboarding", () => ({
  getUserGoals: (...args: any[]) => mockGetUserGoals(...args),
}));

import DashboardScreen from "../../app/(tabs)/dashboard";

const emptyLog = {
  date: "2026-03-18",
  meals: [],
  totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
};

const logWithMeals = {
  date: "2026-03-18",
  meals: [
    {
      id: "1",
      timestamp: Date.now(),
      photoUri: null,
      foods: [
        {
          name: "Chicken",
          portion: "6 oz",
          macros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
          confidence: 90,
          category: "main" as const,
        },
      ],
      totalMacros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
      overallConfidence: 90,
    },
  ],
  totalMacros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDailyLog.mockResolvedValue(emptyLog);
  mockGetWeekLogs.mockResolvedValue([emptyLog]);
  mockGetUserGoals.mockResolvedValue(null);
});

describe("DashboardScreen", () => {
  it("renders daily progress section with macro labels", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText("Daily Progress")).toBeTruthy();
    });
    expect(getByText("Calories")).toBeTruthy();
    expect(getByText("Protein")).toBeTruthy();
    expect(getByText("Carbs")).toBeTruthy();
    expect(getByText("Fat")).toBeTruthy();
  });

  it("displays macro values from daily log", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/280 \/ 2000 kcal/)).toBeTruthy();
      expect(getByText(/53 \/ 150 g/)).toBeTruthy();
    });
  });

  it("uses custom goals when available", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    mockGetUserGoals.mockResolvedValue({
      targetCalories: 1800,
      targetProtein: 120,
      targetCarbs: 200,
      targetFat: 60,
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/280 \/ 1800 kcal/)).toBeTruthy();
      expect(getByText(/53 \/ 120 g/)).toBeTruthy();
    });
  });

  it("renders week section", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText("This Week")).toBeTruthy();
      expect(getByText("Week Summary")).toBeTruthy();
    });
  });

  it("shows correct stats in week summary", async () => {
    const weekLogs = [logWithMeals, emptyLog, emptyLog, emptyLog, emptyLog, emptyLog, emptyLog];
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    mockGetWeekLogs.mockResolvedValue(weekLogs);

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText("Avg Calories")).toBeTruthy();
      expect(getByText("Total Meals")).toBeTruthy();
      expect(getByText("Days Logged")).toBeTruthy();
    });
  });
});

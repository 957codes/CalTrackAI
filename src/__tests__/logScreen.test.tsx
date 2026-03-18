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
const mockDeleteMealEntry = jest.fn();
jest.mock("../utils/storage", () => ({
  getDailyLog: (...args: any[]) => mockGetDailyLog(...args),
  deleteMealEntry: (...args: any[]) => mockDeleteMealEntry(...args),
}));

import LogScreen from "../../app/(tabs)/log";

const emptyLog = {
  date: "2026-03-18",
  meals: [],
  totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
};

const logWithMeals = {
  date: "2026-03-18",
  meals: [
    {
      id: "meal-1",
      timestamp: 1710777600000,
      photoUri: "file://photo.jpg",
      foods: [
        {
          name: "Grilled Chicken Breast",
          portion: "6 oz",
          macros: { calories: 280, protein: 53, carbs: 0, fat: 6 },
          confidence: 92,
          category: "main" as const,
        },
        {
          name: "Brown Rice",
          portion: "1 cup",
          macros: { calories: 215, protein: 5, carbs: 45, fat: 2 },
          confidence: 85,
          category: "side" as const,
        },
      ],
      totalMacros: { calories: 495, protein: 58, carbs: 45, fat: 8 },
      overallConfidence: 88,
    },
  ],
  totalMacros: { calories: 495, protein: 58, carbs: 45, fat: 8 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDailyLog.mockResolvedValue(emptyLog);
  mockDeleteMealEntry.mockResolvedValue(undefined);
});

describe("LogScreen", () => {
  it("shows empty state when no meals logged", async () => {
    const { getByText } = render(<LogScreen />);
    await waitFor(() => {
      expect(getByText("No meals logged today")).toBeTruthy();
      expect(
        getByText("Head to the Camera tab to scan your first meal")
      ).toBeTruthy();
    });
  });

  it("renders meal list when meals exist", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    const { getByText } = render(<LogScreen />);

    await waitFor(() => {
      expect(getByText("1 meal today")).toBeTruthy();
      expect(getByText("Grilled Chicken Breast")).toBeTruthy();
      expect(getByText("Brown Rice")).toBeTruthy();
    });
  });

  it("shows macro summary bar", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    const { getByText } = render(<LogScreen />);

    await waitFor(() => {
      expect(getByText("Calories")).toBeTruthy();
      expect(getByText("Protein")).toBeTruthy();
      expect(getByText("Carbs")).toBeTruthy();
      expect(getByText("Fat")).toBeTruthy();
    });
  });

  it("displays food details with portion and macros", async () => {
    mockGetDailyLog.mockResolvedValue(logWithMeals);
    const { getByText } = render(<LogScreen />);

    await waitFor(() => {
      expect(
        getByText(/6 oz · 280 kcal · P:53g C:0g F:6g/)
      ).toBeTruthy();
      expect(
        getByText(/1 cup · 215 kcal · P:5g C:45g F:2g/)
      ).toBeTruthy();
    });
  });

  it("pluralizes meal count correctly for multiple meals", async () => {
    const multiMealLog = {
      ...logWithMeals,
      meals: [
        ...logWithMeals.meals,
        {
          id: "meal-2",
          timestamp: Date.now(),
          photoUri: null,
          foods: [
            {
              name: "Salad",
              portion: "1 bowl",
              macros: { calories: 150, protein: 5, carbs: 10, fat: 8 },
              confidence: 80,
              category: "main" as const,
            },
          ],
          totalMacros: { calories: 150, protein: 5, carbs: 10, fat: 8 },
          overallConfidence: 80,
        },
      ],
    };
    mockGetDailyLog.mockResolvedValue(multiMealLog);
    const { getByText } = render(<LogScreen />);

    await waitFor(() => {
      expect(getByText("2 meals today")).toBeTruthy();
    });
  });
});

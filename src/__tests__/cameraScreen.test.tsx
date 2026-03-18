/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemeProvider } from "../theme";

// Mock services at module level
const mockAnalyzeFoodPhoto = jest.fn();
jest.mock("../services/foodAnalysis", () => ({
  analyzeFoodPhoto: (...args: any[]) => mockAnalyzeFoodPhoto(...args),
}));

const mockAddMealEntry = jest.fn();
jest.mock("../utils/storage", () => ({
  addMealEntry: (...args: any[]) => mockAddMealEntry(...args),
}));

const mockSaveCorrection = jest.fn();
jest.mock("../utils/corrections", () => ({
  saveCorrection: (...args: any[]) => mockSaveCorrection(...args),
}));

// Import after mocks
import CameraScreen from "../../app/(tabs)/index";

const mockAnalysisResult = {
  foods: [
    {
      name: "Grilled Chicken",
      portion: "6 oz breast",
      macros: { calories: 280, protein: 52, carbs: 0, fat: 6 },
      confidence: 85,
      category: "main" as const,
      corrected: false,
    },
    {
      name: "Brown Rice",
      portion: "1 cup cooked",
      macros: { calories: 215, protein: 5, carbs: 45, fat: 2 },
      confidence: 80,
      category: "side" as const,
      corrected: false,
    },
  ],
  totalMacros: { calories: 495, protein: 57, carbs: 45, fat: 8 },
  overallConfidence: 82,
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <CameraScreen />
    </ThemeProvider>
  );
}

describe("CameraScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzeFoodPhoto.mockResolvedValue(mockAnalysisResult);
    mockAddMealEntry.mockResolvedValue(undefined);
    mockSaveCorrection.mockResolvedValue(undefined);
  });

  describe("initial state", () => {
    it("renders snap meal UI with action buttons", () => {
      renderScreen();
      expect(screen.getByText("Snap Your Meal")).toBeTruthy();
      expect(screen.getByText("Take Photo")).toBeTruthy();
      expect(screen.getByText("Choose from Gallery")).toBeTruthy();
      expect(screen.getByText("Scan Barcode")).toBeTruthy();
    });

    it("shows tip text", () => {
      renderScreen();
      expect(
        screen.getByText(/Include a fork or your hand/)
      ).toBeTruthy();
    });
  });

  describe("photo capture flow", () => {
    it("requests camera permission and analyzes photo", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
        base64: true,
        quality: 0.7,
      });

      await waitFor(() => {
        expect(mockAnalyzeFoodPhoto).toHaveBeenCalledWith("base64data");
      });
    });

    it("shows analysis results after photo capture", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getByText("Analysis Results")).toBeTruthy();
        expect(screen.getByText("Grilled Chicken")).toBeTruthy();
        expect(screen.getByText("Brown Rice")).toBeTruthy();
        expect(screen.getByText("280 kcal")).toBeTruthy();
        expect(screen.getByText("215 kcal")).toBeTruthy();
      });
    });

    it("shows macro totals", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getAllByText("Calories").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Protein").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Carbs").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fat").length).toBeGreaterThan(0);
      });
    });

    it("shows confidence badge", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getByText("82%")).toBeTruthy();
      });
    });
  });

  describe("gallery pick flow", () => {
    it("launches image library and analyzes", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Choose from Gallery"));
      });

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        base64: true,
        quality: 0.7,
      });

      await waitFor(() => {
        expect(mockAnalyzeFoodPhoto).toHaveBeenCalledWith("base64data");
        expect(screen.getByText("Grilled Chicken")).toBeTruthy();
      });
    });
  });

  describe("camera permission denied", () => {
    it("shows alert when camera permission denied", async () => {
      const { Alert } = require("react-native");
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
      });

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission needed",
        "Camera access is required to scan meals."
      );
      expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });
  });

  describe("save meal flow", () => {
    it("saves meal entry when Save to Log is pressed", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getByText("Save to Log")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Save to Log"));
      });

      expect(mockAddMealEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          foods: mockAnalysisResult.foods,
          totalMacros: mockAnalysisResult.totalMacros,
          overallConfidence: 82,
          userVerified: false,
        })
      );

      await waitFor(() => {
        expect(screen.getByText("Saved to today's log!")).toBeTruthy();
      });
    });

    it("can verify accuracy before saving", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getByText("Looks right!")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Looks right!"));
      });

      expect(screen.getByText("Verified")).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText("Save to Log"));
      });

      expect(mockAddMealEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          userVerified: true,
        })
      );
    });
  });

  describe("reset flow", () => {
    it("resets to initial state on Scan Another Meal", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getByText("Analysis Results")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Scan Another Meal"));
      });

      expect(screen.getByText("Snap Your Meal")).toBeTruthy();
    });
  });

  describe("low confidence warning", () => {
    it("shows warning when confidence is below 70", async () => {
      mockAnalyzeFoodPhoto.mockResolvedValueOnce({
        ...mockAnalysisResult,
        overallConfidence: 55,
      });

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Some items may be inaccurate/)
        ).toBeTruthy();
      });
    });

    it("does not show warning when confidence is 70+", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(screen.getByText("Analysis Results")).toBeTruthy();
      });

      expect(screen.queryByText(/Some items may be inaccurate/)).toBeNull();
    });
  });

  describe("error handling", () => {
    it("shows error alert when analysis fails", async () => {
      const { Alert } = require("react-native");
      mockAnalyzeFoodPhoto.mockRejectedValueOnce(new Error("API error"));

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to analyze the photo. Please try again."
        );
      });
    });
  });

  describe("cancelled capture", () => {
    it("does nothing when camera is cancelled", async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Take Photo"));
      });

      expect(mockAnalyzeFoodPhoto).not.toHaveBeenCalled();
      expect(screen.getByText("Snap Your Meal")).toBeTruthy();
    });
  });
});

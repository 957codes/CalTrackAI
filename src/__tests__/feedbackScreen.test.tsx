/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { ThemeProvider } from "../theme";

// Mock services
const mockSaveFeedback = jest.fn();
jest.mock("../services/feedbackService", () => ({
  saveFeedback: (...args: any[]) => mockSaveFeedback(...args),
}));

// Mock expo-router Stack.Screen
jest.mock("expo-router", () => {
  const React = require("react");
  const StackScreen = (props: any) => (props.children ? React.createElement(React.Fragment, null, props.children) : null);
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    Stack: { Screen: StackScreen },
    useFocusEffect: jest.fn((cb: () => void) => cb()),
  };
});

import FeedbackScreen from "../../app/feedback";

function renderScreen() {
  return render(
    <ThemeProvider>
      <FeedbackScreen />
    </ThemeProvider>
  );
}

describe("FeedbackScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveFeedback.mockResolvedValue({ id: "fb_test", status: "pending" });
  });

  describe("initial state", () => {
    it("renders category selection", () => {
      renderScreen();
      expect(screen.getByText("What's this about?")).toBeTruthy();
      expect(screen.getByText("Bug Report")).toBeTruthy();
      expect(screen.getByText("Feature Request")).toBeTruthy();
      expect(screen.getByText("General Feedback")).toBeTruthy();
    });

    it("does not show form fields before category selection", () => {
      renderScreen();
      expect(screen.queryByText("Subject")).toBeNull();
      expect(screen.queryByText("Description")).toBeNull();
    });
  });

  describe("category selection", () => {
    it("shows form fields after selecting Bug Report", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Bug Report"));
      });

      expect(screen.getByText("How severe is this?")).toBeTruthy();
      expect(screen.getByText("Subject")).toBeTruthy();
      expect(screen.getByText("Description")).toBeTruthy();
      expect(screen.getByText("Blocks usage")).toBeTruthy();
      expect(screen.getByText("Annoying but usable")).toBeTruthy();
      expect(screen.getByText("Minor / cosmetic")).toBeTruthy();
    });

    it("shows form fields without severity for Feature Request", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Feature Request"));
      });

      expect(screen.getByText("Subject")).toBeTruthy();
      expect(screen.getByText("Description")).toBeTruthy();
      expect(screen.queryByText("How severe is this?")).toBeNull();
    });

    it("shows form fields without severity for General Feedback", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("General Feedback"));
      });

      expect(screen.getByText("Subject")).toBeTruthy();
      expect(screen.queryByText("How severe is this?")).toBeNull();
    });
  });

  describe("form submission - bug report", () => {
    it("submits bug report with all fields", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Bug Report"));
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Blocks usage"));
      });

      const subjectInput = screen.getByPlaceholderText("Brief description of the issue");
      const descInput = screen.getByPlaceholderText(
        "Steps to reproduce, what happened vs. what you expected"
      );
      const emailInput = screen.getByPlaceholderText("you@example.com");

      await act(async () => {
        fireEvent.changeText(subjectInput, "App crashes on photo");
        fireEvent.changeText(descInput, "When I take a photo the app crashes");
        fireEvent.changeText(emailInput, "user@test.com");
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Submit Feedback"));
      });

      expect(mockSaveFeedback).toHaveBeenCalledWith({
        category: "bug",
        subject: "App crashes on photo",
        description: "When I take a photo the app crashes",
        severity: "blocks_usage",
        contactEmail: "user@test.com",
      });

      await waitFor(() => {
        expect(screen.getByText("Thanks for your feedback!")).toBeTruthy();
      });
    });
  });

  describe("form submission - feature request", () => {
    it("submits feature request without severity", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Feature Request"));
      });

      const subjectInput = screen.getByPlaceholderText("What feature would you like?");
      const descInput = screen.getByPlaceholderText(
        "Describe the feature and how it would help you"
      );

      await act(async () => {
        fireEvent.changeText(subjectInput, "Water tracking");
        fireEvent.changeText(descInput, "I want to track water intake");
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Submit Feedback"));
      });

      expect(mockSaveFeedback).toHaveBeenCalledWith({
        category: "feature",
        subject: "Water tracking",
        description: "I want to track water intake",
        severity: undefined,
        contactEmail: undefined,
      });
    });
  });

  describe("confirmation screen", () => {
    it("shows confirmation after successful submit", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("General Feedback"));
      });

      const subjectInput = screen.getByPlaceholderText("What's on your mind?");
      const descInput = screen.getByPlaceholderText("Tell us more...");

      await act(async () => {
        fireEvent.changeText(subjectInput, "Love the app");
        fireEvent.changeText(descInput, "Great work");
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Submit Feedback"));
      });

      await waitFor(() => {
        expect(screen.getByText("Thanks for your feedback!")).toBeTruthy();
        expect(screen.getByText(/typically respond within 24 hours/)).toBeTruthy();
        expect(screen.getByText("Done")).toBeTruthy();
      });
    });

    it("navigates back when Done is pressed", async () => {
      const { router } = require("expo-router");
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("General Feedback"));
      });

      const subjectInput = screen.getByPlaceholderText("What's on your mind?");
      const descInput = screen.getByPlaceholderText("Tell us more...");

      await act(async () => {
        fireEvent.changeText(subjectInput, "Test");
        fireEvent.changeText(descInput, "Test");
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Submit Feedback"));
      });

      await waitFor(() => {
        expect(screen.getByText("Done")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText("Done"));
      });

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("submit button is disabled without required fields", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Feature Request"));
      });

      // Submit button exists but should be disabled (no subject/description)
      const submitBtn = screen.getByText("Submit Feedback");
      expect(submitBtn).toBeTruthy();
      // We can't easily test disabled state in RNTL, but we can verify
      // that pressing it doesn't call saveFeedback
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(mockSaveFeedback).not.toHaveBeenCalled();
    });

    it("bug report requires severity", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("Bug Report"));
      });

      const subjectInput = screen.getByPlaceholderText("Brief description of the issue");
      const descInput = screen.getByPlaceholderText(
        "Steps to reproduce, what happened vs. what you expected"
      );

      await act(async () => {
        fireEvent.changeText(subjectInput, "Bug title");
        fireEvent.changeText(descInput, "Bug description");
      });

      // No severity selected — submit should not work
      await act(async () => {
        fireEvent.press(screen.getByText("Submit Feedback"));
      });

      expect(mockSaveFeedback).not.toHaveBeenCalled();
    });
  });

  describe("character limits", () => {
    it("shows subject character count", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("General Feedback"));
      });

      expect(screen.getByText("0/80")).toBeTruthy();

      const subjectInput = screen.getByPlaceholderText("What's on your mind?");
      await act(async () => {
        fireEvent.changeText(subjectInput, "Hello");
      });

      expect(screen.getByText("5/80")).toBeTruthy();
    });

    it("shows description character count", async () => {
      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText("General Feedback"));
      });

      expect(screen.getByText("0/500")).toBeTruthy();
    });
  });
});

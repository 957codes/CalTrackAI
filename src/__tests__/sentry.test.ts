import * as Sentry from "@sentry/react-native";
import {
  initSentry,
  setSentryUserContext,
  trackScreenNavigation,
  trackUserAction,
} from "../services/sentry";

// Setup mock is in setup.ts

describe("sentry service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initSentry", () => {
    it("calls Sentry.init with correct config", () => {
      initSentry();
      expect(Sentry.init).toHaveBeenCalledTimes(1);
      const config = (Sentry.init as jest.Mock).mock.calls[0][0];
      expect(config).toHaveProperty("dsn");
      expect(config.tracesSampleRate).toBe(0.2);
      expect(config).toHaveProperty("beforeSend");
    });

    it("beforeSend returns event unchanged", () => {
      initSentry();
      const config = (Sentry.init as jest.Mock).mock.calls[0][0];
      const mockEvent = { message: "test" };
      expect(config.beforeSend(mockEvent)).toBe(mockEvent);
    });
  });

  describe("setSentryUserContext", () => {
    it("sets subscription_status tag", () => {
      setSentryUserContext({ subscriptionStatus: "premium" });
      expect(Sentry.setTag).toHaveBeenCalledWith(
        "subscription_status",
        "premium"
      );
    });

    it("sets screen_name tag", () => {
      setSentryUserContext({ screenName: "dashboard" });
      expect(Sentry.setTag).toHaveBeenCalledWith("screen_name", "dashboard");
    });

    it("sets last_action tag", () => {
      setSentryUserContext({ lastAction: "photo_taken" });
      expect(Sentry.setTag).toHaveBeenCalledWith("last_action", "photo_taken");
    });

    it("sets multiple tags at once", () => {
      setSentryUserContext({
        subscriptionStatus: "free",
        screenName: "camera",
        lastAction: "opened_app",
      });
      expect(Sentry.setTag).toHaveBeenCalledTimes(3);
    });

    it("skips undefined fields", () => {
      setSentryUserContext({});
      expect(Sentry.setTag).not.toHaveBeenCalled();
    });

    it("skips only undefined fields when partial", () => {
      setSentryUserContext({ screenName: "settings" });
      expect(Sentry.setTag).toHaveBeenCalledTimes(1);
      expect(Sentry.setTag).toHaveBeenCalledWith("screen_name", "settings");
    });
  });

  describe("trackScreenNavigation", () => {
    it("adds navigation breadcrumb", () => {
      trackScreenNavigation("dashboard");
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "navigation",
        message: "Navigated to dashboard",
        level: "info",
      });
    });

    it("sets screen_name tag", () => {
      trackScreenNavigation("camera");
      expect(Sentry.setTag).toHaveBeenCalledWith("screen_name", "camera");
    });
  });

  describe("trackUserAction", () => {
    it("adds user_action breadcrumb without data", () => {
      trackUserAction("photo_taken");
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "user_action",
        message: "photo_taken",
        data: undefined,
        level: "info",
      });
    });

    it("adds user_action breadcrumb with data", () => {
      trackUserAction("meal_saved", { calories: "500", foods: "2" });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "user_action",
        message: "meal_saved",
        data: { calories: "500", foods: "2" },
        level: "info",
      });
    });

    it("sets last_action tag", () => {
      trackUserAction("barcode_scanned");
      expect(Sentry.setTag).toHaveBeenCalledWith(
        "last_action",
        "barcode_scanned"
      );
    });
  });
});

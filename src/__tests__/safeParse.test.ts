/**
 * Tests for safeParse — corrupted AsyncStorage data recovery.
 */
import { safeParse } from "../utils/safeParse";
import * as Sentry from "@sentry/react-native";

describe("safeParse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses valid JSON", () => {
    const result = safeParse('{"a":1}', {}, "test");
    expect(result).toEqual({ a: 1 });
  });

  it("returns fallback on corrupted data", () => {
    const fallback = { meals: [], totalMacros: { calories: 0 } };
    const result = safeParse("not valid json{{{", fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("returns fallback on empty string", () => {
    const result = safeParse("", [], "test");
    expect(result).toEqual([]);
  });

  it("returns fallback on truncated JSON", () => {
    const result = safeParse('{"meals":[{"id":"m1"', {}, "test");
    expect(result).toEqual({});
  });

  it("logs to Sentry on parse failure", () => {
    safeParse("corrupted", {}, "getDailyLog");
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "JSON parse failed on stored data",
      expect.objectContaining({
        level: "warning",
        extra: expect.objectContaining({ context: "getDailyLog" }),
      })
    );
  });

  it("does not log to Sentry on valid JSON", () => {
    safeParse('{"ok":true}', {}, "test");
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("handles null-like corrupted values", () => {
    const result = safeParse("undefined", 42, "test");
    expect(result).toBe(42);
  });

  it("parses arrays correctly", () => {
    const result = safeParse('[1,2,3]', [], "test");
    expect(result).toEqual([1, 2, 3]);
  });
});
